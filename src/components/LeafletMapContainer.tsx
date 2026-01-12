import React, { useLayoutEffect } from 'react';
import { MapContainer } from 'react-leaflet';

/**
 * Leaflet (and therefore react-leaflet) throws "Map container is already initialized"
 * when the same DOM element keeps a leftover `_leaflet_id` between remounts.
 *
 * This wrapper clears that flag *before* MapContainer's internal effect runs,
 * making the app resilient after error-boundary resets / fast remounts.
 */
type LeafletMapContainerProps = {
  id: string;
  children: React.ReactNode;
} & Record<string, any>;

const LeafletMapContainer: React.FC<LeafletMapContainerProps> = ({ id, children, ...rest }) => {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const el = document.getElementById(id) as any;
    if (!el) return;

    // If a previous Leaflet instance crashed before proper cleanup, `_leaflet_id` can persist.
    if (el._leaflet_id) {
      try {
        delete el._leaflet_id;
      } catch {
        el._leaflet_id = undefined;
      }
    }
  }, [id]);

  return (
    <MapContainer {...(rest as any)} {...({ id } as any)}>
      {children}
    </MapContainer>
  );
};

export default LeafletMapContainer;
