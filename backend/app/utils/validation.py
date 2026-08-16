"""
Validacio de fitxers pujats.

Regla de seguretat: mai confiar nomes en l'extensio del fitxer. Comprovem
la mida real i la "signatura" (magic bytes) del contingut.
"""

from fastapi import UploadFile

from app.core.config import get_settings

# Els PDF sempre comencen amb aquests bytes, independentment del nom del fitxer.
PDF_MAGIC_BYTES = b"%PDF-"


class FileValidationError(Exception):
    """Fitxer pujat no valid: mida excessiva o contingut que no es un PDF real."""


async def validate_pdf_upload(file: UploadFile) -> bytes:
    """
    Llegeix i valida un fitxer pujat com a PDF.

    Returns:
        El contingut en bytes, ja validat.

    Raises:
        FileValidationError: si supera la mida maxima o no es un PDF real.
    """
    settings = get_settings()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    content = await file.read()

    if len(content) > max_bytes:
        raise FileValidationError(
            f"El fitxer supera el maxim de {settings.max_upload_size_mb}MB."
        )

    if not content.startswith(PDF_MAGIC_BYTES):
        raise FileValidationError(
            "El fitxer no es un PDF valid (signatura de contingut incorrecta)."
        )

    return content
