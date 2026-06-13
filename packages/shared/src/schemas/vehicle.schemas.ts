import { z } from 'zod';
import { VehicleType } from '../types/enums';

export const CreateVehicleSchema = z.object({
  plateNumber: z.string().max(20).optional(),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.CAR),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export type CreateVehicleDto = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof UpdateVehicleSchema>;
