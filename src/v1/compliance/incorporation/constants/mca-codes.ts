export const NIC_CODES = [
  { code: '62011', description: 'IT Software development', industry: 'Technology' },
  { code: '62013', description: 'Computer consultancy and computer facilities management activities', industry: 'Technology' },
  { code: '70200', description: 'Management consultancy activities', industry: 'Consulting' },
  { code: '45200', description: 'Maintenance and repair of motor vehicles', industry: 'Automobile' },
  { code: '46100', description: 'Wholesale on a fee or contract basis', industry: 'Trading' },
  { code: '47110', description: 'Retail sale in non-specialized stores with food, beverages or tobacco predominating', industry: 'Retail' },
  { code: '56101', description: 'Restaurants and mobile food service activities', industry: 'Hospitality' },
];

export const HSN_CODES = [
  { code: '998311', description: 'Management consulting and management services', type: 'SAC' },
  { code: '998313', description: 'Information technology (IT) design and development services', type: 'SAC' },
  { code: '8471', description: 'Automatic data processing machines and units thereof', type: 'HSN' },
  { code: '8517', description: 'Telephone sets, including smartphones', type: 'HSN' },
];

export const PIN_TO_ROC = {
  '11': { city: 'New Delhi', roc: 'ROC Delhi', state: 'Delhi' },
  '40': { city: 'Mumbai', roc: 'ROC Mumbai', state: 'Maharashtra' },
  '60': { city: 'Chennai', roc: 'ROC Chennai', state: 'Tamil Nadu' },
  '56': { city: 'Bangalore', roc: 'ROC Bangalore', state: 'Karnataka' },
  '50': { city: 'Hyderabad', roc: 'ROC Hyderabad', state: 'Telangana' },
  '70': { city: 'Kolkata', roc: 'ROC Kolkata', state: 'West Bengal' },
};
