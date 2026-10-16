import { useState } from 'react';

export interface TripFormState {
  platform: string;
  fare: string;
  distance: string;
  deadhead: string;
  duration: string;
  energyPrice: string;
}

export function useTripForm() {
  const [platform, setPlatform] = useState('');
  const [fare, setFare] = useState('');
  const [distance, setDistance] = useState('');
  const [deadhead, setDeadhead] = useState('');
  const [duration, setDuration] = useState('');
  const [energyPrice, setEnergyPrice] = useState('');

  const reset = () => {
    setPlatform('');
    setFare('');
    setDistance('');
    setDeadhead('');
    setDuration('');
    setEnergyPrice('');
  };

  const isValid = !!platform.trim() && Number(fare) >= 0 && Number(distance) > 0;

  return {
    platform,
    setPlatform,
    fare,
    setFare,
    distance,
    setDistance,
    deadhead,
    setDeadhead,
    duration,
    setDuration,
    energyPrice,
    setEnergyPrice,
    reset,
    isValid,
  };
}
