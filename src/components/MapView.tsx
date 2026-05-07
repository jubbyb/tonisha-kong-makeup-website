import { useEffect, useRef, useState } from 'react';
import {
  Map as MlMap,
  Marker,
  Popup,
  NavigationControl,
  AttributionControl,
  LngLatBounds,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  highlightedId?: number | null;
  autoFit?: boolean;
}

const JM_CENTER: [number, number] = [-77.2975, 18.1096];
const JM_ZOOM = 8;
const TILE_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export function MapView({
  artists,
  onArtistClick,
  editable,
  onLocationChange,
  highlightedId,
  autoFit = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());
  const onLocationChangeRef = useRef(onLocationChange);
  const onArtistClickRef = useRef(onArtistClick);
  const [mapReady, setMapReady] = useState(false);

  onLocationChangeRef.current = onLocationChange;
  onArtistClickRef.current = onArtistClick;

  // Effect 1: init map (and tear down on unmount / editable change)
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MlMap({
      container: containerRef.current,
      style: TILE_STYLE,
      center: JM_CENTER,
      zoom: JM_ZOOM,
      attributionControl: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    mapRef.current = map;

    const handleLoad = () => setMapReady(true);
    map.on('load', handleLoad);

    if (editable) {
      map.on('click', (e) => {
        onLocationChangeRef.current?.(e.lngLat.lat, e.lngLat.lng);
      });
      containerRef.current.style.cursor = 'crosshair';
    }

    const markers = markersRef.current;
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [editable]);

  // Effect 2: diff-based marker sync
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const seen = new Set<number>();

    artists.forEach((artist) => {
      if (artist.lat == null || artist.lng == null) return;
      seen.add(artist.id);

      let marker = markersRef.current.get(artist.id);
      if (!marker) {
        const el = document.createElement('div');
        el.className = 'sj-map-marker';
        el.textContent = artist.name.charAt(0).toUpperCase();

        const popup = new Popup({ offset: 25, closeButton: false }).setHTML(
          `<div style="padding:8px;font-family:Inter,sans-serif;font-size:13px;">
             <strong>${escapeHtml(artist.name)}</strong><br/>
             ${
               artist.slug
                 ? `<a href="/artists/${escapeHtml(artist.slug)}" style="color:var(--accent);">View profile →</a>`
                 : ''
             }
           </div>`,
        );

        marker = new Marker({ element: el })
          .setLngLat([artist.lng, artist.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => onArtistClickRef.current?.(artist));
        markersRef.current.set(artist.id, marker);
      } else {
        marker.setLngLat([artist.lng, artist.lat]);
      }

      const el = marker.getElement();
      el.dataset.highlighted = highlightedId === artist.id ? '1' : '0';
    });

    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [artists, highlightedId, mapReady]);

  // Effect 3: auto-fit bounds (browse mode only)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || editable || !autoFit) return;

    const coords: [number, number][] = artists
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => [a.lng as number, a.lat as number]);
    if (coords.length === 0) return;

    const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 600 });
  }, [artists, mapReady, editable, autoFit]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      {!mapReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-card)',
            borderRadius: '6px',
            pointerEvents: 'none',
          }}
        >
          <span className="loading loading-spinner loading-md" />
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}
