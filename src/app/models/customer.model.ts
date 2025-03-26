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
  monthlyIncome: number;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
}