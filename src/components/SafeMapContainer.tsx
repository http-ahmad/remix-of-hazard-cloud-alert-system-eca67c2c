import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SafeMapContainerProps {
  center: LatLngExpression;
  zoom: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  mapKey?: string | number;
}

/**
 * A wrapper around MapContainer that properly handles remounting
 * to prevent "Map container is already initialized" errors.
 */
const SafeMapContainer: React.FC<SafeMapContainerProps> = ({
  center,
  zoom,
  style,
  className,
  children,
  mapKey
}) => {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueKey = useRef(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Small delay to ensure DOM is ready and any previous map is cleaned up
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => {
      clearTimeout(timer);
      setIsReady(false);
    };
  }, [mapKey]);

  // Generate a unique key for each mount
  const currentKey = mapKey !== undefined ? `${uniqueKey.current}-${mapKey}` : uniqueKey.current;

  if (!isReady) {
    return (
      <div 
        ref={containerRef}
        style={style} 
        className={className}
      >
        <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
          <span className="text-muted-foreground text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      key={currentKey}
      {...({ center, zoom, style, className } as any)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } as any)}
      />
      {children}
    </MapContainer>
  );
};

export default SafeMapContainer;
