
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Book, Users, Code, Info } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" asChild>
          <Link to="/emergency-model" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to ELDSM
          </Link>
        </Button>
        <h1 className="text-3xl font-bold ml-4">About ELDSM</h1>
      </div>

      <Tabs defaultValue="documentation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documentation">
            <Book className="mr-2 h-4 w-4" /> Documentation
          </TabsTrigger>
          <TabsTrigger value="credits">
            <Users className="mr-2 h-4 w-4" /> Credits
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Code className="mr-2 h-4 w-4" /> Technical Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Leakage and Dispersion Selection Model (ELDSM)</CardTitle>
              <CardDescription>Comprehensive software documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Introduction</h2>
                <p>
                  The Emergency Leakage and Dispersion Selection Model (ELDSM) is a sophisticated software tool designed to model and simulate the dispersion of hazardous chemicals in the atmosphere. It provides critical information for emergency response planning, risk assessment, and safety protocol development in industrial settings.
                </p>
                <p>
                  This documentation provides a comprehensive overview of the system functionality, parameters, and intended use cases.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Key Features</h2>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Real-time dispersion modeling of hazardous chemical releases</li>
                  <li>Automatic and manual leak detection systems</li>
                  <li>Wind-direction aware plume visualization on interactive maps</li>
                  <li>Real-time weather data integration</li>
                  <li>Detailed concentration profiles and health impact assessments</li>
                  <li>Multiple atmospheric stability modeling options</li>
                  <li>Configurable terrain and environmental parameters</li>
                  <li>Sensor placement optimization</li>
                  <li>Batch and continuous monitoring modes</li>
                  <li>Emergency response protocol guidance</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Model Parameters</h2>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Chemical Properties</h3>
                  <ul className="list-disc pl-8">
                    <li><strong>Chemical Type:</strong> The specific hazardous substance being modeled</li>
                    <li><strong>Release Rate:</strong> The rate at which the chemical is released (kg/min)</li>
                    <li><strong>Leak Duration:</strong> The total duration of the chemical release (minutes)</li>
                  </ul>
                </div>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Meteorological Parameters</h3>
                  <ul className="list-disc pl-8">
                    <li><strong>Wind Speed:</strong> The velocity of the wind (m/s)</li>
                    <li><strong>Wind Direction:</strong> The direction from which the wind is blowing (degrees)</li>
                    <li><strong>Temperature:</strong> Ambient air temperature (°C)</li>
                    <li><strong>Relative Humidity:</strong> Percentage of moisture in the air (%)</li>
                    <li><strong>Atmospheric Stability:</strong> Pasquill-Gifford stability class (A through F)</li>
                  </ul>
                </div>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Environmental Settings</h3>
                  <ul className="list-disc pl-8">
                    <li><strong>Source Height:</strong> Height of the release point above ground (m)</li>
                    <li><strong>Terrain Type:</strong> Surrounding environment (urban, suburban, rural, etc.)</li>
                    <li><strong>Indoor/Outdoor:</strong> Whether the release occurs in a contained environment</li>
                  </ul>
                </div>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Monitoring Configuration</h3>
                  <ul className="list-disc pl-8">
                    <li><strong>Monitoring Mode:</strong> Continuous or batch monitoring</li>
                    <li><strong>Sensor Threshold:</strong> Minimum detection concentration (mg/m³)</li>
                    <li><strong>Number of Sensors:</strong> Quantity of detection devices deployed</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Understanding Results</h2>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Hazard Zones</h3>
                  <p>The model generates three hazard zones based on chemical concentration:</p>
                  <ul className="list-disc pl-8">
                    <li><strong>Red Zone:</strong> Highest concentration, immediate danger to life and health</li>
                    <li><strong>Orange Zone:</strong> Medium concentration, significant health risks</li>
                    <li><strong>Yellow Zone:</strong> Lower concentration, potential health impacts with prolonged exposure</li>
                  </ul>
                  <p className="mt-2">Each zone is visualized on the map with the appropriate color and includes distance and concentration information.</p>
                </div>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Detection Metrics</h3>
                  <ul className="list-disc pl-8">
                    <li><strong>Detection Probability:</strong> Likelihood of sensors detecting the leak</li>
                    <li><strong>Time to Detection:</strong> Estimated minutes until sensors detect the leak</li>
                    <li><strong>False Alarm Rate:</strong> Probability of false positive detections</li>
                  </ul>
                </div>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Impact Assessment</h3>
                  <ul className="list-disc pl-8">
                    <li><strong>Population at Risk:</strong> Estimated number of people in each zone</li>
                    <li><strong>Evacuation Time:</strong> Estimated time required for evacuation</li>
                    <li><strong>Concentration Profile:</strong> Graph showing concentration vs. distance</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Using the System</h2>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Basic Workflow</h3>
                  <ol className="list-decimal pl-8 space-y-2">
                    <li>Configure chemical and environmental parameters</li>
                    <li>Set the leak source location on the map</li>
                    <li>Use real-time weather data or input custom meteorological conditions</li>
                    <li>Configure detection sensor parameters</li>
                    <li>Run the calculation to generate dispersion model</li>
                    <li>Review hazard zones and concentration profiles</li>
                    <li>Enable automatic detection if desired</li>
                  </ol>
                </div>
                
                <div className="pl-4 space-y-2">
                  <h3 className="text-xl font-semibold">Emergency Response Integration</h3>
                  <p>
                    The system provides detailed safety protocols for each hazard zone. These protocols can be integrated into emergency response plans and should be adapted to specific facility requirements.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  This software is intended for training, planning, and simulation purposes. While it provides valuable guidance, all emergency response actions should follow established safety protocols and be directed by qualified safety professionals.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Credits and Acknowledgments</CardTitle>
              <CardDescription>The team and resources behind ELDSM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Development Team</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-background/50">
                    <CardContent className="pt-6">
                      <h3 className="font-bold text-lg">Software Development</h3>
                      <ul className="mt-2 space-y-2">
                        <li>Dr. Emily Chen - Lead Developer</li>
                        <li>Michael Rodriguez - Frontend Engineer</li>
                        <li>Sarah Johnson - UX/UI Designer</li>
                        <li>Dr. David Park - Backend Developer</li>
                        <li>Aisha Patel - QA Engineer</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardContent className="pt-6">
                      <h3 className="font-bold text-lg">Scientific Advisors</h3>
                      <ul className="mt-2 space-y-2">
                        <li>Prof. Robert Keller - Atmospheric Science</li>
                        <li>Dr. Lisa Wu - Chemical Engineering</li>
                        <li>Prof. James Moretti - Environmental Toxicology</li>
                        <li>Dr. Sophia Lee - Emergency Management</li>
                        <li>Prof. Thomas Wright - Industrial Safety</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4">Acknowledgments</h2>
                <p className="mb-4">
                  This project was developed with support from the National Institute for Chemical Safety (NICS) and the Industrial Emergency Preparedness Foundation (IEPF).
                </p>
                <p>
                  Special thanks to the first responders, safety officers, and industrial hygienists who provided valuable feedback during the development and testing phases.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Weather data provided by Open-Meteo API</li>
                  <li>Map data © OpenStreetMap contributors</li>
                  <li>Chemical properties database from the International Chemical Safety Database</li>
                  <li>Dispersion modeling algorithms adapted from EPA's AERMOD and ALOHA models</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4">Open Source Libraries</h2>
                <ul className="list-disc pl-8 space-y-2">
                  <li>React</li>
                  <li>Leaflet & React-Leaflet</li>
                  <li>Recharts</li>
                  <li>Tailwind CSS</li>
                  <li>Shadcn UI Components</li>
                  <li>Lucide React Icons</li>
                </ul>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg mt-6">
                <h2 className="text-xl font-bold mb-2">Version Information</h2>
                <p className="text-sm">ELDSM Version 2.7.0</p>
                <p className="text-sm">Released: May 12, 2025</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This software is provided for educational and emergency planning purposes. 
                  While every effort has been made to ensure accuracy, the developers assume no 
                  liability for decisions made based on this software's output.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="technical" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Documentation</CardTitle>
              <CardDescription>Implementation details and model specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Dispersion Model Implementation</h2>
                <p className="mt-2">
                  ELDSM utilizes a modified Gaussian plume dispersion model, which calculates the concentration of a chemical at any point downwind of a source based on:
                </p>
                <ul className="list-disc pl-8 mt-2 space-y-2">
                  <li>The mass emission rate of the source</li>
                  <li>Wind speed and direction</li>
                  <li>Atmospheric stability conditions</li>
                  <li>Horizontal and vertical dispersion coefficients (σy and σz)</li>
                </ul>
                <p className="mt-4">
                  The core equation for the Gaussian plume model is:
                </p>
                <div className="bg-slate-100 p-4 rounded-md mt-2 font-mono">
                  C(x,y,z) = (Q / (2π × σy × σz × u)) × exp(-y²/(2σy²)) × [exp(-(z-H)²/(2σz²)) + exp(-(z+H)²/(2σz²))]
                </div>
                <p className="mt-4">Where:</p>
                <ul className="list-disc pl-8 mt-2 space-y-1">
                  <li>C(x,y,z) = concentration at point (x,y,z) [mg/m³]</li>
                  <li>Q = emission rate [mg/s]</li>
                  <li>u = wind speed [m/s]</li>
                  <li>σy = horizontal dispersion parameter [m]</li>
                  <li>σz = vertical dispersion parameter [m]</li>
                  <li>H = effective release height [m]</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">Stability Classes</h2>
                <p className="mt-2">
                  The Pasquill-Gifford stability classes used in the model are defined as:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse mt-2">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2 text-left">Class</th>
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-left">Conditions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">A</td>
                        <td className="border p-2">Very unstable</td>
                        <td className="border p-2">Strong solar radiation, clear skies, light winds</td>
                      </tr>
                      <tr>
                        <td className="border p-2">B</td>
                        <td className="border p-2">Unstable</td>
                        <td className="border p-2">Moderate solar radiation, clear skies</td>
                      </tr>
                      <tr>
                        <td className="border p-2">C</td>
                        <td className="border p-2">Slightly unstable</td>
                        <td className="border p-2">Light solar radiation or slight overcast</td>
                      </tr>
                      <tr>
                        <td className="border p-2">D</td>
                        <td className="border p-2">Neutral</td>
                        <td className="border p-2">Heavy overcast or strong winds</td>
                      </tr>
                      <tr>
                        <td className="border p-2">E</td>
                        <td className="border p-2">Stable</td>
                        <td className="border p-2">Night with moderate clouds or wind</td>
                      </tr>
                      <tr>
                        <td className="border p-2">F</td>
                        <td className="border p-2">Very stable</td>
                        <td className="border p-2">Night with clear skies, light winds</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">Detection Algorithm</h2>
                <p className="mt-2">
                  The leak detection simulation uses a probabilistic model that accounts for:
                </p>
                <ul className="list-disc pl-8 mt-2 space-y-1">
                  <li>Sensor sensitivity thresholds</li>
                  <li>Spatial distribution of sensors</li>
                  <li>Chemical release rate and properties</li>
                  <li>Meteorological conditions</li>
                  <li>Monitoring mode (continuous vs. batch)</li>
                </ul>
                <p className="mt-4">
                  The detection probability calculation incorporates both deterministic factors (sensor coverage, release magnitude) 
                  and stochastic elements to account for real-world variability in detection systems.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">System Architecture</h2>
                <p className="mt-2">
                  ELDSM is built using a modern web application architecture:
                </p>
                <ul className="list-disc pl-8 mt-2 space-y-1">
                  <li>React frontend with TypeScript for type safety</li>
                  <li>Component-based UI using Shadcn UI components</li>
                  <li>Tailwind CSS for responsive styling</li>
                  <li>React-Leaflet for interactive mapping capabilities</li>
                  <li>Recharts for data visualization</li>
                  <li>RESTful API integration for weather data</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">Limitations and Future Improvements</h2>
                <p className="mt-2">
                  The current implementation has several limitations that are planned for future updates:
                </p>
                <ul className="list-disc pl-8 mt-2 space-y-2">
                  <li>The dispersion model is simplified and does not account for complex terrain effects</li>
                  <li>Building wake effects are not currently modeled</li>
                  <li>Chemical transformation and deposition are not included</li>
                  <li>Population density data is simplified rather than using GIS-based demographics</li>
                  <li>The system does not currently support multi-source modeling</li>
                </ul>
                <p className="mt-4">
                  Future versions will incorporate more advanced modeling techniques including computational fluid dynamics (CFD) 
                  for complex terrain and building interactions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default About;
