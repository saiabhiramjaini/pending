import type { Request, Response } from "express";
import { paymentService } from "../services/paymentService";

export const paymentController = {
  async create(req: Request, res: Response) {
    const row = await paymentService.create(req.auth!.userId, req.body);
    res.status(201).json({ success: true, message: "Payment created", data: serialize(row) });
  },
  async get(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const row = await paymentService.get(req.auth!.userId, id);
    res.status(200).json({ success: true, message: "OK", data: serialize(row) });
  },
  async patch(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const row = await paymentService.patch(req.auth!.userId, id, req.body.status);
    res.status(200).json({ success: true, message: "OK", data: serialize(row) });
  },
  async list(req: Request, res: Response) {
    const data = await paymentService.list(
      req.auth!.userId,
      typeof req.query.cursor === "string" ? req.query.cursor : undefined,
      req.query.limit ? Number(req.query.limit) : undefined,
    );
    res.status(200).json({ success: true, message: "OK", data });
  },
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function serialize(row: {
  id: string;
  userId: string;
  merchantId: string;
  amount: string;
  currency: string;
  upiApp: string | null;
  note: string | null;
  status: string;
  idempotencyKey: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}) {
  return {
    ...row,
    amount: String(row.amount),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}
