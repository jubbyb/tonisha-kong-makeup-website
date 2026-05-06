import { useEffect, useRef } from 'react';

export interface MapArtist {
  id: number;
  name: string;
  slug: string | null;
  lat?: number;
  lng?: number;
  photo_url?: string | null;
  bio?: string | null;
  specialties?: string | null;
  location?: string | null;
  whatsapp_number?: string | null;
  industries?: { slug: string; name: string }[];
  rating?: number;
  review_count?: number;
}

interface MapViewProps {
  artists: MapArtist[];
  onArtistClick?: (artist: MapArtist) => void;
  editable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

export function MapView({ artists, onArtistClick, editable, onLocationChange }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import MapLibre (optional - for code-splitting)
    import('maplibre-gl').then((maplibre) => {
      const center: [number, number] = [-76.8024, 18.0735]; // Jamaica center

      mapRef.current = new maplibre.Map({
        container: containerRef.current as HTMLElement,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center,
        zoom: 8,
      });

      // Add artists as markers
      artists.forEach((artist) => {
        if (!artist.lat || !artist.lng) return;

        const el = document.createElement('div');
        el.className = 'map-marker';
        el.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent);
          border: 2px solid var(--bg-elev);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          color: white;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        el.textContent = artist.name.charAt(0).toUpperCase();

        const popup = new maplibre.Popup({ offset: 25 }).setHTML(
          `<div style="padding: 8px; font-family: Inter, sans-serif; font-size: 13px;">
            <strong>${artist.name}</strong><br/>
            ${artist.slug ? `<a href="/artists/${artist.slug}" style="color: var(--accent);">View profile →</a>` : ''}
          </div>`,
        );

        new maplibre.Marker({ element: el })
          .setLngLat([artist.lng, artist.lat])
          .setPopup(popup)
          .addTo(mapRef.current);

        el.addEventListener('click', () => {
          if (onArtistClick) onArtistClick(artist);
        });
      });

      // Editable mode: click to set location
      if (editable) {
        mapRef.current.on('click', (e: any) => {
          if (onLocationChange) {
            onLocationChange(e.lngLat.lat, e.lngLat.lng);
          }
        });
        containerRef.current!.style.cursor = 'crosshair';
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [artists, editable, onArtistClick, onLocationChange]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
      }}
    />
  );
}
