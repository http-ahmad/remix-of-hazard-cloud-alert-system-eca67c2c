import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer } from 'react-leaflet';

/**
 * Robust Leaflet map wrapper that prevents "Map container is already initialized"
 * and "Map container is being reused" errors.
 */
type LeafletMapContainerProps = {
  id: string;
  children?: React.ReactNode;
} & Record<string, any>;

const LeafletMapContainer: React.FC<LeafletMapContainerProps> = ({ id, children, style, className, ...mapProps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [uniqueKey, setUniqueKey] = useState(() => `${id}-${Date.now()}`);
  const mountedRef = useRef(true);

  const cleanupContainer = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    if ((el as any)._leaflet_id !== undefined) {
      try { delete (el as any)._leaflet_id; } catch { (el as any)._leaflet_id = undefined; }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    setUniqueKey(`${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    if (containerRef.current) cleanupContainer(containerRef.current);
    const timer = setTimeout(() => { if (mountedRef.current) setIsReady(true); }, 100);
    return () => { mountedRef.current = false; clearTimeout(timer); setIsReady(false); if (containerRef.current) cleanupContainer(containerRef.current); };
  }, [id, cleanupContainer]);

  if (!isReady) {
    return (
      <div ref={containerRef} id={id} style={{ height: '100%', width: '100%', ...style }} className={className}>
        <div className="flex items-center justify-center h-full w-full bg-muted/20 animate-pulse">
          <span className="text-muted-foreground text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} id={id} style={{ height: '100%', width: '100%' }}>
      <MapContainer key={uniqueKey} {...(mapProps as any)} style={{ height: '100%', width: '100%', ...style }} className={className}>
        {children}
      </MapContainer>
    </div>
  );
};

export default LeafletMapContainer;
