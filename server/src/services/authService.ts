import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BCRYPT_ROUNDS, JWT_EXPIRES_IN } from "@pending/api-contract";
import { AppError } from "../errors/AppError";
import { userRepository } from "../repositories/userRepository";

function toPublic(user: { id: string; name: string; email: string; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function signToken(userId: string, email: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, "INTERNAL_ERROR", "Something went wrong");
  }
  return jwt.sign({ userId, email }, secret, { expiresIn: JWT_EXPIRES_IN });
}

export const authService = {
  async signup(input: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, "CONFLICT", "User with this email already exists");
    }
    const password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({ ...input, password });
    return { token: signToken(user.id, user.email), user: toPublic(user) };
  },
  async signin(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
    }
    return { token: signToken(user.id, user.email), user: toPublic(user) };
  },
  async profile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }
    return toPublic(user);
  },
  async deleteAccount(userId: string) {
    await userRepository.deleteById(userId);
  },
};
