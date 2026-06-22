import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

export interface PickedImage {
  uri:       string;
  fileName?: string;
  type?:     string;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

async function ensureCameraPermission(): Promise<boolean> {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === 'granted') return true;
  if (!canAskAgain) {
    Alert.alert(
      'Camera Permission',
      'Camera access is permanently denied. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }
  return false;
}

async function ensureGalleryPermission(): Promise<boolean> {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status === 'granted') return true;
  if (!canAskAgain) {
    Alert.alert(
      'Gallery Permission',
      'Gallery access is permanently denied. Please enable it in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }
  return false;
}

// ─── Normalise asset URI for Android ─────────────────────────────────────────
// On Android, expo-image-picker returns content:// URIs which Axios can handle.
// On iOS file:// URIs are fine as-is.

function normaliseUri(uri: string): string {
  if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
    return `file://${uri}`;
  }
  return uri;
}

// ─── Pickers ──────────────────────────────────────────────────────────────────

/** Capture a single photo from the camera. Returns null if cancelled or denied. */
export async function pickFromCamera(allowsEditing = false): Promise<PickedImage | null> {
  const ok = await ensureCameraPermission();
  if (!ok) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      quality:       0.85,
      allowsEditing,
      exif:          false,
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    return {
      uri:      normaliseUri(asset.uri),
      fileName: asset.fileName ?? `camera_${Date.now()}.jpg`,
      type:     asset.mimeType ?? 'image/jpeg',
    };
  } catch {
    return null;
  }
}

/** Pick one or more images from the gallery. */
export async function pickFromGallery(maxImages = 1): Promise<PickedImage[]> {
  const ok = await ensureGalleryPermission();
  if (!ok) return [];

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:              ['images'] as ImagePicker.MediaType[],
      allowsMultipleSelection: maxImages > 1,
      selectionLimit:          maxImages,
      quality:                 0.85,
      exif:                    false,
    });

    if (result.canceled || !result.assets?.length) return [];

    return result.assets.map(a => ({
      uri:      normaliseUri(a.uri),
      fileName: a.fileName ?? `gallery_${Date.now()}.jpg`,
      type:     a.mimeType ?? 'image/jpeg',
    }));
  } catch {
    return [];
  }
}

/**
 * Show an Alert action sheet and let the user choose Camera or Gallery.
 * Returns null if cancelled or permission denied.
 */
export function promptPickImage(title = 'Upload Photo'): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    Alert.alert(title, 'Choose source', [
      {
        text: 'Camera',
        onPress: () => pickFromCamera(true).then(resolve),
      },
      {
        text: 'Gallery',
        onPress: () => pickFromGallery(1).then(imgs => resolve(imgs[0] ?? null)),
      },
      {
        text:    'Cancel',
        style:   'cancel',
        onPress: () => resolve(null),
      },
    ]);
  });
}

/**
 * Show an Alert action sheet for multi-image selection.
 * Camera captures one image; Gallery allows up to maxImages.
 */
export function promptPickMultipleImages(
  maxImages = 5,
  title     = 'Add Photos',
): Promise<PickedImage[]> {
  return new Promise((resolve) => {
    Alert.alert(title, 'Choose source', [
      {
        text: 'Camera',
        onPress: () => pickFromCamera(false).then(img => resolve(img ? [img] : [])),
      },
      {
        text: 'Gallery',
        onPress: () => pickFromGallery(maxImages).then(resolve),
      },
      {
        text:    'Cancel',
        style:   'cancel',
        onPress: () => resolve([]),
      },
    ]);
  });
}
