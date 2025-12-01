interface ManifestImage {
  file: string;
  location: string;
}

interface Manifest {
  [key: string]: ManifestImage[];
}

interface ImageData {
  url: string;
  city: string;
}

export interface MonthAlbum {
  month: string;
  monthKey: string;
  year: number;
  images: ImageData[];
}

const MONTH_ORDER = [
  { name: 'December', key: 'dec' },
  { name: 'November', key: 'nov' },
  { name: 'October', key: 'oct' },
  { name: 'September', key: 'sep' },
  { name: 'August', key: 'aug' },
  { name: 'July', key: 'jul' },
  { name: 'June', key: 'jun' },
  { name: 'May', key: 'may' },
  { name: 'April', key: 'apr' },
  { name: 'March', key: 'mar' },
  { name: 'February', key: 'feb' },
  { name: 'January', key: 'jan' },
];

export async function fetchAlbums(): Promise<MonthAlbum[]> {
  try {
    const response = await fetch('/sunsets/manifest.json');
    const manifest: Manifest = await response.json();
    
    return MONTH_ORDER
      .filter(m => manifest[m.key] && manifest[m.key].length > 0)
      .map(m => ({
        month: m.name,
        monthKey: m.key,
        year: 2025,
        images: manifest[m.key].slice(0, 10).map(img => ({
          url: `/sunsets/${img.file}`,
          city: img.location,
        })),
      }));
  } catch (error) {
    console.error('Failed to load manifest:', error);
    return [];
  }
}
