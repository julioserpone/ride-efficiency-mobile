import type { EnergyType, EnergyUnit } from '@/lib/types';
import { useState } from 'react';

export interface VehicleFormState {
  selectedCountry: number | null;
  vehicleName: string;
  energyType: EnergyType;
  economy: string;
  commission: string;
}

export function useVehicleForm(initialCountryId: number | null = null) {
  const [selectedCountry, setSelectedCountry] = useState<number | null>(initialCountryId);
  const [vehicleName, setVehicleName] = useState('');
  const [energyType, setEnergyType] = useState<EnergyType>('regular_gasoline');
  const [economy, setEconomy] = useState('');
  const [commission, setCommission] = useState('');

  const energyUnit: EnergyUnit = energyType === 'electric' ? 'kwh' : 'litres';

  const reset = () => {
    setVehicleName('');
    setEconomy('');
    setCommission('');
  };

  const isValid = !!selectedCountry && !!vehicleName.trim() && Number(economy) > 0;

  return {
    selectedCountry,
    setSelectedCountry,
    vehicleName,
    setVehicleName,
    energyType,
    setEnergyType,
    economy,
    setEconomy,
    commission,
    setCommission,
    energyUnit,
    reset,
    isValid,
  };
}
