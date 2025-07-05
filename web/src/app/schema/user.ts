import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  icon: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});


export const userCreateSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const userUpdateSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export type UserInterface = z.infer<typeof userSchema>;
export type UserCreateInterface = z.infer<typeof userCreateSchema>;
export type UserUpdateInterface = z.infer<typeof userUpdateSchema>;

