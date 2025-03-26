export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  address: Address;
  ssn: string;
  employmentDetails: EmploymentDetails[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  residenceDuration: number; // in months
}

export interface EmploymentDetails {
  employerName: string;
  position: string;
  employmentDuration: number; // in months
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
  startDate: string; // in ISO format (e.g., "2020-01-01")
  endDate?: string; // optional, in ISO format
}