import React from 'react';

interface DetectionSource {
  id: string;
  location: { lat: number; lng: number };
  chemicalType: string;
  releaseRate: number;
  isActive: boolean;
  confidence: number;
  lastDetected: Date;
  sensorReadings: Array<{ value: number; timestamp: Date; sensorId: string }>;
}

interface MonitoringSensor {
  id: string;
  lat: number;
  lng: number;
  confidence: number;
  lastReading: Date;
  chemicalReadings: Array<{ chemical: string; concentration: number; timestamp: Date }>;
}

interface AdvancedMultiSourceDetectionProps {
  detectionSources: DetectionSource[];
  monitoringSensors: MonitoringSensor[];
  onSourcesUpdate: (sources: DetectionSource[]) => void;
  onSensorsUpdate: (sensors: MonitoringSensor[]) => void;
}

const AdvancedMultiSourceDetection: React.FC<AdvancedMultiSourceDetectionProps> = ({
  detectionSources,
  monitoringSensors,
  onSourcesUpdate,
  onSensorsUpdate
}) => {
  return (
    <div>
      <h2>Advanced Multi-Source Detection</h2>
      <div>
        <h3>Detection Sources</h3>
        {detectionSources.map(source => (
          <div key={source.id}>
            <p>Source ID: {source.id}</p>
            <p>Location: {source.location.lat}, {source.location.lng}</p>
            <p>Chemical: {source.chemicalType}</p>
            <p>Release Rate: {source.releaseRate}</p>
            <p>Active: {source.isActive ? 'Yes' : 'No'}</p>
            <p>Confidence: {source.confidence}</p>
            <p>Last Detected: {source.lastDetected.toString()}</p>
            <ul>
              {source.sensorReadings.map((reading, index) => (
                <li key={index}>
                  Value: {reading.value}, Timestamp: {reading.timestamp.toString()}, Sensor ID: {reading.sensorId}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <h3>Monitoring Sensors</h3>
        {monitoringSensors.map(sensor => (
          <div key={sensor.id}>
            <p>Sensor ID: {sensor.id}</p>
            <p>Location: {sensor.lat}, {sensor.lng}</p>
            <p>Confidence: {sensor.confidence}</p>
            <p>Last Reading: {sensor.lastReading.toString()}</p>
            <ul>
              {sensor.chemicalReadings.map((reading, index) => (
                <li key={index}>
                  Chemical: {reading.chemical}, Concentration: {reading.concentration}, Timestamp: {reading.timestamp.toString()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button onClick={() => onSourcesUpdate(detectionSources)}>Update Sources</button>
      <button onClick={() => onSensorsUpdate(monitoringSensors)}>Update Sensors</button>
    </div>
  );
};

export default AdvancedMultiSourceDetection;
