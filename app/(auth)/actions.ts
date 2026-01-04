"use server";

import { z } from "zod";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  return { status: "failed" };
};

export type RegisterActionState = {
  status:
  | "idle"
  | "in_progress"
  | "success"
  | "failed"
  | "user_exists"
  | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  return { status: "failed" };
};
