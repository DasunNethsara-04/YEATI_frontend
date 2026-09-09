/**
 * Crop image mapping utility for AgriPiyasa.
 * Resolves local vegetable asset paths from /vegetables/ or remote image_url.
 */

export const CROP_IMAGE_MAP: Record<string, string> = {
  'tomato': '/vegetables/Tomato.jpg',
  'capsicum': '/vegetables/Capsicum.jpg',
  'cucumber': '/vegetables/Cucumber.jpg',
  'carrot': '/vegetables/Carrots.jpg',
  'carrots': '/vegetables/Carrots.jpg',
  'brinjal': '/vegetables/Brinjals.jpg',
  'brinjals': '/vegetables/Brinjals.jpg',
  'eggplant': '/vegetables/Brinjals.jpg',
  'chilli': '/vegetables/Green chilli.jpg',
  'green chilli': '/vegetables/Green chilli.jpg',
  'chili': '/vegetables/Green chilli.jpg',
};

/**
 * Returns the image URL for a crop by prioritizing any direct image_url,
 * then falling back to matching against local vegetable assets.
 */
export const getCropImageUrl = (
  cropName?: string | null,
  customUrl?: string | null
): string | undefined => {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl;
  }
  if (!cropName) return undefined;

  const lower = cropName.toLowerCase().trim();
  for (const [key, path] of Object.entries(CROP_IMAGE_MAP)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      return path;
    }
  }
  return undefined;
};
