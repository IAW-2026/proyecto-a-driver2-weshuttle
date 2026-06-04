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
      className={`block w-full rounded-lg border py-1.5 pl-3 pr-10 text-sm font-semibold disabled:opacity-50 transition-colors focus:outline-none ${
        currentStatus === 'APPROVED' ? 'border-[#10B981] bg-[#ECFDF5] text-[#047857]' : ''
      } ${
        currentStatus === 'REJECTED' ? 'border-[#EF4444] bg-[#FEF2F2] text-[#B91C1C]' : ''
      } ${
        currentStatus === 'PENDING' ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]' : ''
      }`}
    >
      <option value="PENDING" className="bg-white text-gray-900">Pendiente</option>
      <option value="APPROVED" className="bg-white text-gray-900">Verificado</option>
      <option value="REJECTED" className="bg-white text-gray-900">Rechazado</option>
    </select>
  );
}