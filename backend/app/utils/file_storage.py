import hashlib
import os
import uuid
from pathlib import Path
import aiofiles
from fastapi import UploadFile
from ..config import UPLOAD_DIR, ARTIFACTS_DIR

def compute_sha256(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

async def save_upload_file(upload_file: UploadFile) -> tuple[str, str, int, str]:
    """
    Saves uploaded file to UPLOAD_DIR with unique filename.
    Returns: (stored_filename, absolute_file_path, file_size_in_bytes, sha256_hash)
    """
    file_ext = Path(upload_file.filename).suffix.lower() if upload_file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    target_path = UPLOAD_DIR / unique_filename

    total_bytes = 0
    sha256 = hashlib.sha256()

    async with aiofiles.open(target_path, "wb") as out_file:
        while content := await upload_file.read(65536):
            total_bytes += len(content)
            sha256.update(content)
            await out_file.write(content)

    return unique_filename, str(target_path), total_bytes, sha256.hexdigest()

def get_ela_output_path(original_stored_filename: str) -> str:
    stem = Path(original_stored_filename).stem
    heatmap_name = f"ela_{stem}.jpg"
    return str(ARTIFACTS_DIR / heatmap_name)
