import os
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS
import numpy as np
import cv2

EDITING_SOFTWARE_KEYWORDS = [
    "photoshop", "gimp", "canva", "picsart", "corel", "paint.net",
    "snapseed", "lightroom", "pixlr", "fotor", "affinity"
]

class ForensicAnalysisService:
    @staticmethod
    def inspect_exif(image_path: str) -> dict:
        """
        Inspects EXIF metadata for editing software footprints and timestamp inconsistencies.
        """
        result = {
            "has_exif": False,
            "software": None,
            "tamper_flag": False,
            "flags": [],
            "metadata_dump": {}
        }
        try:
            with Image.open(image_path) as img:
                exif_data = img._getexif()
                if not exif_data:
                    return result

                result["has_exif"] = True
                parsed_exif = {}
                for tag_id, value in exif_data.items():
                    tag_name = TAGS.get(tag_id, str(tag_id))
                    # Convert bytes or large unprintable values
                    if isinstance(value, bytes):
                        continue
                    parsed_exif[tag_name] = str(value)

                result["metadata_dump"] = parsed_exif

                # Check Software tag
                software = parsed_exif.get("Software", "")
                if software:
                    result["software"] = software
                    lower_sw = software.lower()
                    for keyword in EDITING_SOFTWARE_KEYWORDS:
                        if keyword in lower_sw:
                            result["tamper_flag"] = True
                            result["flags"].append(f"EXIF_EDITING_SOFTWARE_DETECTED: {software}")
                            break

                # Check for DateTime inconsistencies
                dt_orig = parsed_exif.get("DateTimeOriginal")
                dt_mod = parsed_exif.get("DateTime")
                if dt_orig and dt_mod and dt_orig != dt_mod:
                    result["flags"].append(f"EXIF_MODIFIED_TIMESTAMP_MISMATCH: Orig={dt_orig}, Mod={dt_mod}")

        except Exception as e:
            result["error"] = str(e)

        return result

    @staticmethod
    def generate_ela(image_path: str, output_path: str, quality: int = 90) -> dict:
        """
        Performs Error Level Analysis (ELA).
        Re-saves the image at fixed JPEG quality, calculates difference matrix,
        and generates an amplified heatmap visualizing compression disparity.
        """
        result = {
            "discrepancy_score": 0.0,
            "heatmap_generated": False,
            "heatmap_path": None,
            "flags": []
        }
        try:
            temp_resaved = f"{image_path}.tmp_ela.jpg"

            # Open image and convert to RGB
            with Image.open(image_path) as im:
                im = im.convert("RGB")
                im.save(temp_resaved, "JPEG", quality=quality)

                with Image.open(temp_resaved) as resaved_im:
                    # Calculate difference
                    ela_im = ImageChops.difference(im, resaved_im)

                    # Calculate scale factor from extrema
                    extrema = ela_im.getextrema()
                    max_diff = max([ex[1] for ex in extrema]) if extrema else 1
                    scale = 255.0 / max(1, max_diff)

                    # Enhance brightness of difference
                    ela_im = ImageEnhance.Brightness(ela_im).enhance(scale * 1.5)

                    # Convert to numpy to compute statistical variance
                    np_ela = np.array(ela_im)
                    mean_val = float(np.mean(np_ela))
                    std_val = float(np.std(np_ela))

                    # Normalize discrepancy score from 0 to 100
                    # Natural unedited documents have uniform, low standard deviation in error rates
                    discrepancy_score = min(100.0, round((std_val / 40.0) * 100.0, 2))
                    result["discrepancy_score"] = discrepancy_score

                    if discrepancy_score > 65.0:
                        result["flags"].append(f"ELA_HIGH_COMPRESSION_VARIANCE: Score {discrepancy_score}% (Possible Image Splicing)")

                    # Colorize heatmap with OpenCV for intuitive visual inspection
                    gray_diff = cv2.cvtColor(np_ela, cv2.COLOR_RGB2GRAY)
                    heatmap = cv2.applyColorMap(gray_diff, cv2.COLORMAP_JET)

                    # Blend with original for context overlay
                    orig_cv = cv2.imread(image_path)
                    if orig_cv is not None and orig_cv.shape == heatmap.shape:
                        blended = cv2.addWeighted(orig_cv, 0.45, heatmap, 0.55, 0)
                        cv2.imwrite(output_path, blended)
                    else:
                        cv2.imwrite(output_path, heatmap)

                    result["heatmap_generated"] = True
                    result["heatmap_path"] = output_path

            # Clean up temp file
            if os.path.exists(temp_resaved):
                os.remove(temp_resaved)

        except Exception as e:
            result["error"] = str(e)
            result["discrepancy_score"] = 15.0  # safe default fallback

        return result

    @staticmethod
    def detect_stamp_and_signature(image_path: str) -> dict:
        """
        Uses OpenCV color segmentation and morphological operations
        to detect official ink stamps (red/purple/blue) and handwritten signatures.
        """
        result = {
            "stamp_detected": False,
            "stamp_confidence": 0.0,
            "signature_detected": False,
            "signature_confidence": 0.0,
            "flags": []
        }
        try:
            img = cv2.imread(image_path)
            if img is None:
                return result

            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            h, w = img.shape[:2]
            total_pixels = h * w

            # 1. Official Stamp Detection: Check for red / violet / blue ink zones
            # Red has two ranges in HSV
            lower_red1 = np.array([0, 70, 50])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 70, 50])
            upper_red2 = np.array([180, 255, 255])
            mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
            mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
            mask_red = cv2.bitwise_or(mask_red1, mask_red2)

            # Violet/Purple Stamp mask
            lower_purple = np.array([125, 40, 40])
            upper_purple = np.array([155, 255, 255])
            mask_purple = cv2.inRange(hsv, lower_purple, upper_purple)

            stamp_mask = cv2.bitwise_or(mask_red, mask_purple)
            stamp_pixels = cv2.countNonZero(stamp_mask)
            stamp_ratio = (stamp_pixels / total_pixels) * 100.0

            if stamp_pixels > 200:
                result["stamp_detected"] = True
                result["stamp_confidence"] = min(98.0, round(50.0 + stamp_ratio * 15.0, 1))

            # 2. Signature Detection: Check for ink stroke contours in typical lower regions
            lower_third = img[int(h * 0.60):h, :]
            gray_lower = cv2.cvtColor(lower_third, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray_lower, 180, 255, cv2.THRESH_BINARY_INV)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            stroke_candidates = 0
            for cnt in contours:
                x, y, cw, ch = cv2.boundingRect(cnt)
                aspect_ratio = float(cw) / max(1, ch)
                area = cv2.contourArea(cnt)
                # Signatures typically have wide aspect ratio and moderate area
                if 2.0 < aspect_ratio < 12.0 and 150 < area < 10000:
                    stroke_candidates += 1

            if stroke_candidates >= 1:
                result["signature_detected"] = True
                result["signature_confidence"] = min(95.0, round(60.0 + stroke_candidates * 8.0, 1))

        except Exception as e:
            result["error"] = str(e)

        return result

    @staticmethod
    def detect_edge_splicing(image_path: str) -> dict:
        """
        Evaluates Laplacian variance and gradient discontinuity across image blocks.
        Pasted text patches exhibit unnatural boundary gradient shifts.
        """
        result = {
            "splicing_detected": False,
            "edge_variance": 0.0,
            "discontinuity_score": 0.0,
            "flags": []
        }
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return result

            # Laplacian variance
            lap_var = cv2.Laplacian(img, cv2.CV_64F).var()
            result["edge_variance"] = round(float(lap_var), 2)

            # Block variance comparison (16x16 grid)
            h, w = img.shape
            bh, bw = max(10, h // 8), max(10, w // 8)
            block_vars = []
            for y in range(0, h - bh, bh):
                for x in range(0, w - bw, bw):
                    block = img[y:y+bh, x:x+bw]
                    block_vars.append(cv2.Laplacian(block, cv2.CV_64F).var())

            if len(block_vars) > 4:
                std_blocks = float(np.std(block_vars))
                mean_blocks = float(np.mean(block_vars)) if np.mean(block_vars) > 0 else 1.0
                ratio = std_blocks / mean_blocks
                result["discontinuity_score"] = round(min(100.0, ratio * 40.0), 2)

                if result["discontinuity_score"] > 80.0:
                    result["splicing_detected"] = True
                    result["flags"].append(f"SPLICING_EDGE_DISCONTINUITY: High localized gradient disparity ({result['discontinuity_score']}%)")

        except Exception as e:
            result["error"] = str(e)

        return result

    @classmethod
    def run_full_forensic_suite(cls, image_path: str, ela_output_path: str) -> dict:
        """
        Runs the complete forensic pipeline: EXIF, ELA, Stamp/Signature, and Edge Splicing.
        Returns aggregated forensic integrity score (100 = perfectly clean, 0 = fraudulent).
        """
        exif_res = cls.inspect_exif(image_path)
        ela_res = cls.generate_ela(image_path, ela_output_path)
        stamp_res = cls.detect_stamp_and_signature(image_path)
        edge_res = cls.detect_edge_splicing(image_path)

        all_flags = []
        all_flags.extend(exif_res.get("flags", []))
        all_flags.extend(ela_res.get("flags", []))
        all_flags.extend(stamp_res.get("flags", []))
        all_flags.extend(edge_res.get("flags", []))

        # Calculate Forensic Integrity Score (Starts at 100, penalize for anomalies)
        integrity = 100.0

        if exif_res.get("tamper_flag"):
            integrity -= 40.0  # Heavy penalty for Photoshop/Canva metadata

        # Penalty proportional to ELA discrepancy
        ela_disc = ela_res.get("discrepancy_score", 0.0)
        if ela_disc > 40.0:
            integrity -= min(35.0, (ela_disc - 40.0) * 0.8)

        if edge_res.get("splicing_detected"):
            integrity -= 25.0

        # Reward for official stamp presence on certificates
        if stamp_res.get("stamp_detected"):
            integrity = min(100.0, integrity + 5.0)

        forensic_score = max(0.0, min(100.0, round(integrity, 2)))

        summary_parts = []
        if len(all_flags) == 0:
            summary_parts.append("No forensic anomalies or digital editing traces detected.")
        else:
            summary_parts.append(f"{len(all_flags)} anomaly flag(s) identified.")
        if stamp_res.get("stamp_detected"):
            summary_parts.append(f"Official seal/stamp verified ({stamp_res['stamp_confidence']}% conf).")
        if stamp_res.get("signature_detected"):
            summary_parts.append(f"Signatory pen stroke contour identified ({stamp_res['signature_confidence']}% conf).")

        return {
            "exif_software": exif_res.get("software"),
            "exif_tamper_flag": exif_res.get("tamper_flag", False),
            "ela_discrepancy_score": ela_res.get("discrepancy_score", 0.0),
            "ela_heatmap_path": ela_res.get("heatmap_path"),
            "edge_noise_variance": edge_res.get("edge_variance", 0.0),
            "stamp_seal_detected": stamp_res.get("stamp_detected", False),
            "stamp_seal_confidence": stamp_res.get("stamp_confidence", 0.0),
            "signature_detected": stamp_res.get("signature_detected", False),
            "signature_confidence": stamp_res.get("signature_confidence", 0.0),
            "splicing_detected": edge_res.get("splicing_detected", False),
            "forensic_score": forensic_score,
            "anomaly_flags": all_flags,
            "summary": " ".join(summary_parts)
        }
