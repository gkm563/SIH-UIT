/**
 * Official SIH 2026 Problem Statement Bank (37 Problem Statements - Includes Open Innovation)
 */
const PROBLEM_STATEMENTS = [
  {
    id: 'PS-01',
    title: 'AI-Based Crop Disease & Pest Detection',
    domain: 'Agriculture',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: 'Small and marginal farmers in tier-2/3 regions lose 15-25% of crop yield annually to undetected pest infestation and disease, largely because agricultural extension officers are scarce and farmers rely on guesswork or delayed advice.',
    expectedSolution: [
      'Mobile/web app where farmers upload a leaf/crop photo (offline-first, syncing later)',
      'ML image classification model to identify disease/pest with confidence score',
      'Regional-language treatment recommendations (organic + chemical options with dosage)',
      'Optional integration with local Krishi Vigyan Kendra helpline/database'
    ],
    techStack: ['TensorFlow Lite / PyTorch Mobile', 'React Native / Flutter', 'Firebase', 'PlantVillage dataset'],
    beneficiaries: 'Smallholder farmers, agricultural extension workers.'
  },
  {
    id: 'PS-02',
    title: 'Smart Irrigation & Soil Health Monitor',
    domain: 'Agriculture',
    type: 'Hardware',
    difficulty: 'Intermediate',
    problemStatement: "Over-irrigation and under-irrigation both damage yield and waste India's scarce groundwater. Farmers lack real-time, low-cost visibility into soil moisture, pH, and nutrient levels.",
    expectedSolution: [
      'Soil moisture, temperature, and pH sensor node powered by solar/battery',
      'Microcontroller (ESP32/Arduino) transmitting data via LoRa/GSM to a dashboard',
      'Automated valve/motor trigger for irrigation based on threshold',
      'SMS alerts for farmers without smartphones'
    ],
    techStack: ['ESP32', 'Capacitive soil moisture sensor', 'DHT11/22', 'Relay module', 'Blynk / ThingSpeak'],
    beneficiaries: 'Farmers in water-stressed districts, agri-cooperatives.'
  },
  {
    id: 'PS-03',
    title: 'AI Symptom Checker & Teleconsultation Queue for Rural Clinics',
    domain: 'Healthcare',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: 'Primary Health Centres (PHCs) in rural India are overloaded with a single doctor serving thousands of patients, causing long queues and missed critical cases while minor ailments consume the same time slots.',
    expectedSolution: [
      'Symptom-based triage chatbot to flag urgency level (emergency/moderate/minor)',
      'Digital token/queue system reducing physical waiting',
      'Video-consult integration for non-critical cases with nearby doctors',
      'Basic patient history stored securely for follow-ups'
    ],
    techStack: ['Python / Node.js', 'Rasa / Dialogflow', 'WebRTC', 'PostgreSQL'],
    beneficiaries: 'Rural patients, PHC doctors and staff.'
  },
  {
    id: 'PS-04',
    title: 'Low-Cost Portable Vitals Monitoring Device',
    domain: 'Healthcare',
    type: 'Hardware',
    difficulty: 'Advanced',
    problemStatement: 'ASHA workers and rural clinics often lack affordable devices to continuously track vitals (heart rate, SpO2, temperature) for elderly or high-risk patients between hospital visits.',
    expectedSolution: [
      'Wearable/handheld device measuring pulse, SpO2, and body temperature',
      'Bluetooth/GSM transmission to a companion app or SMS alert for abnormal readings',
      'Data logging for ASHA worker/doctor review',
      'Battery life optimized for field use (8+ hours)'
    ],
    techStack: ['MAX30100/MAX30102', 'ESP32', 'Flutter / Kotlin', 'Firebase'],
    beneficiaries: 'ASHA workers, elderly and chronic-illness patients in rural areas.'
  },
  {
    id: 'PS-05',
    title: 'Vernacular Learning Platform for Competitive Exams',
    domain: 'Education',
    type: 'Software',
    difficulty: 'Beginner',
    problemStatement: 'Students preparing for government exams (SSC, Railways, State PSC) in tier-3 towns often struggle with English-heavy study material, limiting access to quality preparation resources.',
    expectedSolution: [
      'Content platform offering notes, mock tests, and video content in Hindi/regional languages',
      'Adaptive practice tests with performance analytics',
      'Offline-download mode for low-connectivity areas',
      'Peer discussion forum for doubt-solving'
    ],
    techStack: ['React / Next.js', 'Node.js + MongoDB', 'PWA'],
    beneficiaries: 'Competitive-exam aspirants in Tier-2/3 towns.'
  },
  {
    id: 'PS-06',
    title: 'Smart Classroom Attendance System',
    domain: 'Education',
    type: 'Hybrid',
    difficulty: 'Intermediate',
    problemStatement: 'Manual attendance in large colleges consumes classroom time and is prone to proxy attendance, reducing effective teaching hours.',
    expectedSolution: [
      'Camera/RFID-based hardware unit at classroom entry for face or card recognition',
      'Backend dashboard for faculty to view/export attendance instantly',
      'Anti-spoofing checks (liveness detection) to prevent proxy attendance',
      'Parent/student portal showing attendance percentage in real time'
    ],
    techStack: ['OpenCV / face-recognition', 'Raspberry Pi / ESP32-CAM', 'RFID module', 'Django / Node.js'],
    beneficiaries: 'College administration, faculty, students.'
  },
  {
    id: 'PS-07',
    title: 'Women Safety Wearable with Panic Alert',
    domain: 'Women Safety',
    type: 'Hybrid',
    difficulty: 'Advanced',
    problemStatement: 'Existing safety apps require unlocking a phone and multiple taps during an emergency, which is impractical in a real threat scenario. A discreet, instant-trigger solution is needed.',
    expectedSolution: [
      'Wearable device (band/pendant) with a single-press panic button',
      'GPS + GSM module to send live location via SMS/app to pre-set emergency contacts',
      'Companion app showing live tracking to guardians',
      'Fake-call or loud-siren deterrent feature'
    ],
    techStack: ['NEO-6M GPS', 'SIM800L GSM', 'ESP32', 'Flutter'],
    beneficiaries: 'Women commuters, students, working professionals.'
  },
  {
    id: 'PS-08',
    title: 'Flood Prediction & Early Warning System',
    domain: 'Disaster Management',
    type: 'Software',
    difficulty: 'Advanced',
    problemStatement: 'Flood-prone districts often receive warnings too late because prediction relies on manual river-gauge readings rather than integrated real-time data and forecasting models.',
    expectedSolution: [
      'ML model combining rainfall, river water-level history, and terrain data to predict flood probability by region',
      'Public dashboard/app with color-coded risk zones',
      'SMS/push alerts to residents in high-risk zones',
      'Integration-ready design for government IMD/CWC data feeds'
    ],
    techStack: ['Python (scikit-learn/XGBoost)', 'data.gov.in datasets', 'Leaflet.js / Mapbox'],
    beneficiaries: 'District disaster management authorities, residents of flood-prone areas.'
  },
  {
    id: 'PS-09',
    title: 'Landslide/Earthquake Early Warning Sensor Node',
    domain: 'Disaster Management',
    type: 'Hardware',
    difficulty: 'Advanced',
    problemStatement: 'Hilly regions in India face recurring landslides with minimal ground-level sensing infrastructure to give residents even a few minutes of warning.',
    expectedSolution: [
      'Sensor node measuring soil vibration, tilt, and moisture on slopes',
      'Threshold-based buzzer/alert triggered locally plus data transmission to a control dashboard',
      'Low-power design for solar/battery operation in remote areas',
      'Clustered node network to triangulate risk zones'
    ],
    techStack: ['MPU6050', 'Soil moisture sensor', 'LoRa module', 'ESP32', 'Solar panel + battery'],
    beneficiaries: 'Hill-state residents, disaster management cells.'
  },
  {
    id: 'PS-10',
    title: 'AI-Powered Civic Issue Reporting App',
    domain: 'Smart City',
    type: 'Software',
    difficulty: 'Beginner',
    problemStatement: "Potholes, garbage overflow, and broken streetlights go unreported or unresolved for weeks because there's no easy, trackable channel between citizens and municipal bodies.",
    expectedSolution: [
      'App where citizens photograph and geo-tag civic issues',
      'AI-based auto-categorization from the image',
      'Public status tracker (reported → assigned → resolved)',
      'Admin dashboard for municipal staff to prioritize by severity/area'
    ],
    techStack: ['React Native / Flutter', 'Lightweight CNN', 'Node.js + PostgreSQL (PostGIS)'],
    beneficiaries: 'Citizens, municipal corporations.'
  },
  {
    id: 'PS-11',
    title: 'Adaptive Smart Streetlight System',
    domain: 'Smart City',
    type: 'Hardware',
    difficulty: 'Intermediate',
    problemStatement: 'Municipal streetlights often run on fixed timers, wasting electricity on empty roads while poorly lighting high-traffic areas, inflating civic power bills.',
    expectedSolution: [
      'Motion/light sensor per streetlight adjusting brightness based on ambient light and presence',
      'Central dashboard for the municipality to monitor faults and energy usage',
      'Automated fault detection (bulb failure alert)'
    ],
    techStack: ['LDR + PIR sensors', 'ESP32 / Arduino', 'MQTT'],
    beneficiaries: 'Municipal corporations, city residents.'
  },
  {
    id: 'PS-12',
    title: 'Rural Bus Tracking & Crowd Prediction App',
    domain: 'Transportation',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: 'In smaller towns, state-run bus schedules are unreliable and commuters have no visibility into real-time location or expected crowding, leading to long unpredictable waits.',
    expectedSolution: [
      "Live GPS tracking of buses (conductor's phone as data source for MVP)",
      'ETA prediction at each stop using historical + live data',
      'Crowd-level prediction/reporting (crowdsourced by passengers)',
      'Route and fare information in regional languages'
    ],
    techStack: ['Google Maps / OpenStreetMap API', 'Firebase realtime database', 'Flutter'],
    beneficiaries: 'Daily commuters, state transport corporations.'
  },
  {
    id: 'PS-13',
    title: 'Two-Wheeler Accident Detection & Emergency Alert Device',
    domain: 'Transportation',
    type: 'Hardware',
    difficulty: 'Advanced',
    problemStatement: 'India has among the highest two-wheeler fatality rates partly due to delayed emergency response - accidents in remote stretches often go unnoticed for critical golden-hour minutes.',
    expectedSolution: [
      'Accelerometer/gyroscope-based crash detection mounted on the vehicle',
      'Automatic SMS/call trigger to emergency contacts and nearest hospital with GPS location',
      'Manual cancel button for false positives',
      'Optional helmet-integrated version with impact sensor'
    ],
    techStack: ['MPU6050', 'SIM800L GSM', 'NEO-6M GPS', 'Arduino / ESP32'],
    beneficiaries: 'Two-wheeler riders, highway patrol/ambulance services.'
  },
  {
    id: 'PS-14',
    title: 'Smart Waste Bin with Route Optimization',
    domain: 'Waste Management',
    type: 'Hybrid',
    difficulty: 'Intermediate',
    problemStatement: 'Municipal garbage trucks follow fixed routes regardless of actual bin fill-levels, wasting fuel on empty bins while overflowing bins elsewhere go unattended.',
    expectedSolution: [
      'Ultrasonic fill-level sensor in bins transmitting status to a central server',
      'Route optimization algorithm generating the shortest collection path',
      'Dashboard for municipal waste management staff',
      'Citizen-facing map showing nearest available bins'
    ],
    techStack: ['Ultrasonic sensor (HC-SR04)', 'ESP32', 'Google OR-Tools / Dijkstra', 'Web dashboard'],
    beneficiaries: 'Municipal sanitation departments, residents.'
  },
  {
    id: 'PS-15',
    title: 'Water Quality & Contamination Sensor Network',
    domain: 'Water Management',
    type: 'Hardware',
    difficulty: 'Intermediate',
    problemStatement: 'Groundwater and public water-supply contamination is a major rural health hazard, often detected only after illness outbreaks.',
    expectedSolution: [
      'Low-cost multi-parameter water sensor node (pH, turbidity, TDS) at supply points/wells',
      'Real-time alerting to local health/water authority when parameters cross safe limits',
      'Historical data dashboard to identify contamination trends by region'
    ],
    techStack: ['pH sensor', 'Turbidity sensor', 'TDS sensor', 'ESP32', 'ThingSpeak'],
    beneficiaries: 'Rural households, Jal Jeevan Mission/PHED authorities.'
  },
  {
    id: 'PS-16',
    title: 'Solar Microgrid Health Monitoring System',
    domain: 'Renewable Energy',
    type: 'Hardware',
    difficulty: 'Advanced',
    problemStatement: 'Off-grid solar microgrids serving rural hamlets frequently fail silently with no remote diagnostics, leading to prolonged outages before a technician visits.',
    expectedSolution: [
      'Sensor unit monitoring panel voltage/current, battery health, and load consumption',
      'Remote dashboard alerting operators to anomalies',
      'Predictive maintenance flag based on historical performance trends',
      'SMS alert to local operator in areas without internet'
    ],
    techStack: ['ACS712 current sensor', 'Voltage divider', 'ESP32', 'GSM module', 'Cloud dashboard'],
    beneficiaries: 'Rural electrification agencies, off-grid village communities.'
  },
  {
    id: 'PS-17',
    title: 'Voice-Based Banking Assistant for Rural Users',
    domain: 'Financial Inclusion',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: 'Many rural and semi-literate users find app-based banking/UPI interfaces difficult to navigate, limiting adoption of digital financial services despite having bank accounts.',
    expectedSolution: [
      'Voice-command interface in regional languages for balance check, mini statement, and fund transfer',
      'Simple confirmation flow using voice + PIN for security',
      'Offline/IVR fallback mode for users without smartphones'
    ],
    techStack: ['Speech-to-text (Google/Whisper API)', 'NLP intent recognition', 'Mock banking sandbox API'],
    beneficiaries: 'Rural bank account holders, semi-literate users.'
  },
  {
    id: 'PS-18',
    title: 'Farmer-to-Market Direct Selling Platform',
    domain: 'AgriTech / MSME',
    type: 'Software',
    difficulty: 'Beginner',
    problemStatement: 'Farmers often sell produce to middlemen at low prices due to lack of direct market access and real-time mandi price visibility, cutting significantly into their margins.',
    expectedSolution: [
      'Marketplace app connecting farmers directly to buyers/retailers',
      'Live mandi price integration (eNAM-style open data) for informed pricing',
      'Logistics/pickup request feature for transport coordination',
      'Rating system to build buyer-seller trust'
    ],
    techStack: ['React / Flutter', 'Node.js + MongoDB', 'Public mandi price datasets'],
    beneficiaries: 'Farmers, local retailers/wholesalers.'
  },
  {
    id: 'PS-19',
    title: 'UPI/Phishing Fraud Detection Browser Extension',
    domain: 'Cybersecurity',
    type: 'Software',
    difficulty: 'Advanced',
    problemStatement: 'UPI and banking phishing scams are rising sharply in India, and most victims are non-technical users who cannot distinguish a fake payment link/site from a genuine one.',
    expectedSolution: [
      'Extension/app that scans URLs and UPI payment links against phishing patterns and heuristics',
      'Real-time warning banner before a user submits credentials or completes a payment',
      'Community-reported blocklist that updates a shared database',
      'Simple risk-score explanation in plain language'
    ],
    techStack: ['Chrome Extension API', 'Phishing-URL ML classifier (scikit-learn)', 'Backend blocklist API'],
    beneficiaries: 'General banking/UPI users, especially first-time digital adopters.'
  },
  {
    id: 'PS-20',
    title: 'Credential Leak & Dark Web Exposure Monitor',
    domain: 'Cybersecurity',
    type: 'Software',
    difficulty: 'Advanced',
    problemStatement: 'Individuals and small organizations rarely find out their credentials were leaked in a data breach until after fraud occurs, since monitoring tools are enterprise-priced and inaccessible.',
    expectedSolution: [
      'Tool where a user submits an email/domain to check against public breach databases (e.g., HaveIBeenPwned API)',
      'Periodic automated re-checks with alert notifications',
      'Educational guidance on next steps after a detected leak',
      'Scoped to legitimate breach-check APIs only - no scraping or dark web access'
    ],
    techStack: ['HaveIBeenPwned API', 'Node.js / Python backend', 'SendGrid'],
    beneficiaries: 'Individuals, student clubs/small organizations managing shared accounts.'
  },
  {
    id: 'PS-21',
    title: 'Smart Cane for the Visually Impaired',
    domain: 'Assistive Tech',
    type: 'Hardware',
    difficulty: 'Intermediate',
    problemStatement: "Traditional white canes only detect ground-level obstacles, leaving visually impaired users vulnerable to chest/head-level obstacles beyond arm's reach.",
    expectedSolution: [
      'Ultrasonic sensors mounted on a cane detecting obstacles at multiple heights',
      'Vibration/audio feedback indicating obstacle direction and distance',
      'Optional GPS module with a guardian alert feature',
      'Lightweight, low-power, weatherproof design'
    ],
    techStack: ['HC-SR04 ultrasonic sensors', 'Vibration motor', 'Arduino Nano', 'NEO-6M GPS (optional)'],
    beneficiaries: 'Visually impaired individuals.'
  },
  {
    id: 'PS-22',
    title: 'Sign Language to Text/Speech Translator',
    domain: 'Assistive Tech',
    type: 'Software',
    difficulty: 'Advanced',
    problemStatement: 'Communication barriers between hearing/speech-impaired individuals and others remain high due to limited public understanding of Indian Sign Language and lack of accessible translation tools.',
    expectedSolution: [
      'Camera-based gesture recognition model translating ISL gestures into text in real time',
      'Text-to-speech output for two-way communication',
      'Support for a core vocabulary set relevant to daily/emergency use',
      'Simple UI usable on a basic smartphone camera'
    ],
    techStack: ['MediaPipe / OpenCV', 'CNN/LSTM gesture-classification model', 'TensorFlow Lite'],
    beneficiaries: 'Hearing/speech-impaired individuals and the people they interact with.'
  },
  {
    id: 'PS-23',
    title: 'AR-Based Heritage & Tourism Guide',
    domain: 'Tourism & Culture',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: "Smaller heritage sites and local monuments lack interpretive information, causing visitors to miss the historical and cultural significance of what they're seeing.",
    expectedSolution: [
      'App using AR to overlay historical information when a user points their camera at a monument',
      'Audio-guided walking tours in multiple languages',
      'Offline mode for areas with poor connectivity',
      'Local artisan/guide marketplace integration'
    ],
    techStack: ['ARCore / ARKit', 'AR.js (lightweight web-AR)', 'Unity (optional)', 'Content CMS backend'],
    beneficiaries: 'Tourists, local tourism boards, heritage conservation bodies.'
  },
  {
    id: 'PS-24',
    title: 'Gram Panchayat Grievance Redressal Chatbot',
    domain: 'Governance',
    type: 'Software',
    difficulty: 'Beginner',
    problemStatement: "Villagers often don't know the correct department or process to raise grievances, leading to unresolved complaints and repeated in-person visits to panchayat offices.",
    expectedSolution: [
      'WhatsApp/SMS-based chatbot allowing villagers to lodge complaints in regional-language text or voice notes',
      'Automatic categorization and routing to the correct department',
      'Status tracking via a unique complaint ID',
      'Analytics dashboard for panchayat officials to spot recurring issues'
    ],
    techStack: ['WhatsApp Business API / Twilio', 'Dialogflow / Rasa', 'Node.js', 'PostgreSQL'],
    beneficiaries: 'Rural citizens, Gram Panchayat administration.'
  },
  {
    id: 'PS-25',
    title: 'Low-Cost Air Quality Monitoring IoT Device',
    domain: 'Environment',
    type: 'Hardware',
    difficulty: 'Intermediate',
    problemStatement: 'Air quality monitoring stations are concentrated in major cities, leaving smaller towns without any local AQI data despite significant pollution from vehicles, construction, and stubble burning.',
    expectedSolution: [
      'Sensor node measuring PM2.5, PM10, CO2, and humidity',
      'Data transmission to a public dashboard showing real-time hyperlocal AQI',
      'Alert system for hazardous AQI spikes near schools',
      'Low-cost, replicable design for multi-point deployment'
    ],
    techStack: ['PMS5003/SDS011 dust sensor', 'MQ-135 gas sensor', 'ESP32', 'ThingSpeak'],
    beneficiaries: 'Town residents, local pollution control boards, schools.'
  },
  {
    id: 'PS-26',
    title: 'Crowdsourced Tree Plantation & Carbon Tracker',
    domain: 'Environment',
    type: 'Software',
    difficulty: 'Beginner',
    problemStatement: 'Tree plantation drives lack transparent, verifiable tracking of survival rates, so it\'s unclear how much real environmental impact these drives actually achieve.',
    expectedSolution: [
      'App where volunteers geo-tag and photograph planted saplings',
      'Periodic photo check-ins to verify survival over months, gamified with badges/leaderboard',
      'Estimated carbon-offset calculation based on tree species and count',
      'Public map visualizing plantation density and survival rate by region'
    ],
    techStack: ['React Native / Flutter', 'Geo-tagging APIs', 'Firebase'],
    beneficiaries: 'NGOs, forest departments, environmentally conscious citizens.'
  },
  {
    id: 'PS-27',
    title: 'Wearable Performance Tracker for Rural Sports Talent',
    domain: 'Sports',
    type: 'Hybrid',
    difficulty: 'Intermediate',
    problemStatement: 'Talented young athletes in rural areas often go unnoticed by sports scouts and coaching programs due to lack of access to performance-tracking infrastructure.',
    expectedSolution: [
      'Wearable device tracking sprint speed, jump height, and stride metrics',
      'Companion app logging performance history and generating shareable athlete profiles',
      'Comparison against benchmark standards for various sports/age groups',
      'Option to submit profiles to district/state sports authorities or scouts'
    ],
    techStack: ['MPU6050', 'ESP32 / nRF microcontroller', 'BLE', 'Flutter'],
    beneficiaries: 'Rural student-athletes, sports academies, talent scouting programs.'
  },
  {
    id: 'PS-28',
    title: 'Blockchain-Based Land Record Verification',
    domain: 'Blockchain / GovTech',
    type: 'Software',
    difficulty: 'Advanced',
    problemStatement: 'Land record disputes and fraud are a major source of litigation in India due to fragmented, easily tampered paper-based or siloed digital records.',
    expectedSolution: [
      'Blockchain-based ledger recording land ownership transfers immutably',
      'QR-code/ID-based verification portal for buyers to check authentic ownership history',
      'Smart contract simulation for transfer approval workflow',
      'Prototype/simulation only - not a legally binding registry'
    ],
    techStack: ['Hyperledger Fabric / Ethereum testnet', 'Solidity smart contracts', 'React', 'IPFS'],
    beneficiaries: 'Landowners, property buyers, state revenue departments.'
  },
  {
    id: 'PS-29',
    title: 'Deepfake & Regional-Language Fake News Detector',
    domain: 'AI/ML',
    type: 'Software',
    difficulty: 'Advanced',
    problemStatement: 'Misinformation spreads rapidly via WhatsApp/social media in regional languages and increasingly through AI-generated deepfake videos/audio, and most fact-checking tools only cover English content.',
    expectedSolution: [
      'Text classifier flagging likely misinformation patterns in regional-language content',
      'Basic deepfake video/audio detection using artifact-analysis models',
      'Browser extension or WhatsApp-forward checker returning a credibility score with source links',
      'Clear disclaimer that outputs are probabilistic aids, not definitive verdicts'
    ],
    techStack: ['IndicBERT', 'Open-source deepfake detection models', 'Flask / FastAPI'],
    beneficiaries: 'Social media users, fact-checking organizations, journalists.'
  },
  {
    id: 'PS-30',
    title: 'Low-Cost Agri-Robot for Sowing & Weeding',
    domain: 'Robotics',
    type: 'Hardware',
    difficulty: 'Advanced',
    problemStatement: 'Manual sowing and weeding are labor-intensive and increasingly costly for small farmers due to rising rural labor shortages, directly affecting planting timeliness and yield.',
    expectedSolution: [
      'Small wheeled/tracked robot capable of row-based seed dispensing at set intervals',
      'Basic weed-vs-crop visual differentiation to trigger a mechanical weeding arm or targeted micro-spray',
      'Remote/app-based manual override and path control',
      'Rugged, low-cost chassis suited for uneven farmland'
    ],
    techStack: ['Raspberry Pi / Arduino', 'Motor drivers', 'DC geared motors', 'OpenCV', 'RF/Bluetooth remote'],
    beneficiaries: 'Small and marginal farmers, agricultural labor cooperatives.'
  },
  {
    id: 'PS-31',
    title: 'Smart Underground Water Leakage & Non-Revenue Water (NRW) Detector',
    domain: 'Water Management',
    type: 'Hybrid',
    difficulty: 'Advanced',
    problemStatement: 'Urban municipal water utilities lose 35-40% of treated drinking water to undetected underground pipe bursts, illegal valve connections, and pressure surges before reaching household meters.',
    expectedSolution: [
      'IoT pressure & acoustic sensors installed at critical municipal pipeline junctions',
      'AI anomaly detection algorithm identifying micro-leaks and sudden burst drops in real time',
      'Interactive GIS dashboard for municipal engineers pinpointing exact pipe burst coordinates',
      'Automated motor/solenoid valve shutoff to prevent massive clean water loss and street flooding'
    ],
    techStack: ['ESP32', 'Pressure Transducer', 'Acoustic Pulse Sensor', 'Python / Scikit-Learn', 'Mapbox / Leaflet'],
    beneficiaries: 'Municipal Corporations, Jal Nigam, urban households, conservation agencies.'
  },
  {
    id: 'PS-32',
    title: 'Automated Rainwater Harvesting & Aquifer Recharge Quality Monitor',
    domain: 'Water Management',
    type: 'Hardware',
    difficulty: 'Intermediate',
    problemStatement: 'Unmaintained urban rooftop rainwater harvesting pits frequently flush silt, oils, and toxic runoff directly into borewells and groundwater tables, causing severe aquifer contamination.',
    expectedSolution: [
      'Multi-stage motorized self-cleaning filter unit diverting initial dirty rainwater flush',
      'Sensors tracking turbidity, pH, and water volume recharged into borewells',
      'Microcontroller logging seasonal groundwater recharge metrics to cloud',
      'Mobile app for building managers with automatic maintenance and filter clog alerts'
    ],
    techStack: ['Turbidity & pH sensors', 'Water Flow Sensor', 'ESP32 / Arduino', 'Blynk / Firebase'],
    beneficiaries: 'Housing societies, university campuses, commercial complexes, Jal Shakti Abhiyan.'
  },
  {
    id: 'PS-33',
    title: 'AI Smart E-Waste Classifier & Doorstep Recycler Valuation Platform',
    domain: 'Waste Management',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: 'Over 85% of e-waste in India is processed informally using hazardous acid baths and open burning because citizens lack easy doorstep collection and transparent metal scrap valuation.',
    expectedSolution: [
      'AI computer-vision mobile camera scanner recognizing gadgets, PCBs, and appliances',
      'Real-time scrap value calculator based on precious metal market rates (Copper, Gold, Lithium)',
      'Doorstep pickup scheduling connecting households to CPCB-authorized e-waste recyclers',
      'Green credit points and digital certificates issued for certified eco-friendly disposal'
    ],
    techStack: ['TensorFlow.js / OpenCV', 'React Native / Web PWA', 'Node.js + Express', 'MongoDB'],
    beneficiaries: 'Urban households, CPCB authorized recyclers, informal waste sector workers.'
  },
  {
    id: 'PS-34',
    title: 'Bio-Medical Waste Segregation & QR Chain-of-Custody Tracker',
    domain: 'Waste Management',
    type: 'Hybrid',
    difficulty: 'Advanced',
    problemStatement: 'Illegal dumping and mixing of bio-medical waste (sharps, anatomical waste, infected gloves) with general waste poses high biosecurity risks due to lack of real-time tracking from clinics to incinerators.',
    expectedSolution: [
      'Smart color-coded bins (Red, Yellow, Blue, Black) with RFID/QR scanners and weight sensors',
      'Bedside-to-incinerator digital chain-of-custody tracking preventing unauthorized bag dumping',
      'Real-time weight discrepancy alerts flagging missing or stolen hospital waste bags',
      'Automated bio-hazard compliance report generation for State Pollution Control Boards (SPCB)'
    ],
    techStack: ['ESP32', 'HX711 Load Cell Weight Sensor', 'QR / Barcode Scanner', 'PostgreSQL', 'Flutter'],
    beneficiaries: 'Hospitals, diagnostic laboratories, bio-medical waste treatment plants, SPCB officers.'
  },
  {
    id: 'PS-35',
    title: 'AI Solar PV Panel Defect & Dust Degradation Diagnostics',
    domain: 'Renewable Energy',
    type: 'Software',
    difficulty: 'Intermediate',
    problemStatement: 'Dust accumulation, micro-cracks, and hotspots reduce solar PV plant power generation by up to 25%, but manual physical inspection of rooftop arrays is dangerous, slow, and expensive.',
    expectedSolution: [
      'AI computer-vision model analyzing drone/smartphone thermal & RGB photographs of solar arrays',
      'Automatic classification of dust coating, shading, bird droppings, and cracked cell hotspots',
      'Monetary revenue loss estimator calculating power generation loss vs cleaning cost',
      'Weather-integrated automated cleaning scheduler recommending optimal wash intervals'
    ],
    techStack: ['YOLOv8 / PyTorch', 'OpenCV', 'FastAPI', 'Next.js / React'],
    beneficiaries: 'Rooftop solar owners, commercial solar plant operators, green energy developers.'
  },
  {
    id: 'PS-36',
    title: 'Smart EV Charging & Microgrid Solar Load Balancer',
    domain: 'Renewable Energy',
    type: 'Hardware',
    difficulty: 'Advanced',
    problemStatement: 'Uncontrolled simultaneous fast charging of Electric Vehicles (EVs) overloads local grid transformers and drains renewable microgrid batteries during peak non-solar hours.',
    expectedSolution: [
      'Dynamic EV charge-rate controller dynamically scaling power based on live solar generation',
      'Battery Energy Storage System (BESS) integration feeding stored solar energy to chargers during grid peaks',
      'Mobile app displaying dynamic green tariff rates (cheaper charging during peak solar hours)',
      'Transformer overload protection system preventing localized power grid brownouts'
    ],
    techStack: ['ESP32', 'Modbus / CAN Bus protocol', 'PWM Current Controller', 'Node.js / MQTT'],
    beneficiaries: 'EV charging station operators, DISCOMs, renewable microgrid developers, EV owners.'
  },
  {
    id: 'PS-37',
    title: 'Open Innovation — Real-World Problem Solution Track',
    domain: 'Open Innovation',
    type: 'Software / Hardware / Hybrid',
    difficulty: 'All Levels',
    problemStatement: 'Due to overwhelming demand from student innovators and project teams, the Open Innovation track enables participants to identify, articulate, and solve pressing real-world challenges outside the predefined SIH problem statement bank. Teams are empowered to propose and build cutting-edge solutions across any domain—including Healthcare, Smart Cities, Agriculture, FinTech, EdTech, Cybersecurity, Clean Energy, and Social Impact—using software, hardware, or hybrid working prototypes.',
    expectedSolution: [
      'Identify a high-impact real-world problem with a clear domain significance and target user analysis.',
      'Develop a functional working prototype or proof-of-concept (Software Platform, IoT Device, or Hybrid System).',
      'Demonstrate practical scalability, system architecture, data workflows, and execution feasibility.',
      'Provide a comprehensive technical implementation roadmap and cost-effectiveness model.'
    ],
    techStack: ['Open Stack (AI/ML, Web, Mobile, IoT, Embedded Systems, Cloud, Blockchain, etc.)'],
    beneficiaries: 'General Public, Industry Sectors, Rural & Urban Communities, Public Governance, and Domain-Specific Stakeholders.'
  }
];

if (typeof window !== 'undefined') {
  window.PROBLEM_STATEMENTS = PROBLEM_STATEMENTS;
}
