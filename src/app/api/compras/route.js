import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function POST(request) {
  const data = await request.json();

  try {
    const compra = await prisma.compra.create({ data: data });
    return NextResponse.json(compra);
  } catch (error) {
    return NextResponse.json(error);
  }
}

export async function GET() {
  try {
    const compras = await prisma.compra.findMany({
      include: {
        articulo: true,
      },
    });
    return NextResponse.json(compras);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
