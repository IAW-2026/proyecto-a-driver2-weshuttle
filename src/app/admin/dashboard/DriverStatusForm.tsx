'use client';

import { useTransition } from "react";
import { updateDriverVerificationStatus } from "@/app/actions";

interface Props {
  driverId: string;
  currentStatus: string;
}

export default function DriverStatusForm({ driverId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formData = new FormData();
    formData.append('driverId', driverId);
    formData.append('status', e.target.value);

    startTransition(async () => {
      const result = await updateDriverVerificationStatus(formData);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:opacity-50 transition-colors ${
        currentStatus === 'APPROVED' ? 'ring-green-600 bg-green-50 text-green-900' : ''
      } ${
        currentStatus === 'REJECTED' ? 'ring-red-600 bg-red-50 text-red-900' : ''
      } ${
        currentStatus === 'PENDING' ? 'ring-yellow-600 bg-yellow-50 text-yellow-900' : ''
      }`}
    >
      <option value="PENDING">Pendiente</option>
      <option value="APPROVED">Verificado</option> {/* 🚀 CAMBIADO AQUÍ */}
      <option value="REJECTED">Rechazado</option>
    </select>
  );
}