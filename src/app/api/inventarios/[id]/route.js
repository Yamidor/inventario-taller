import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma.js";

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const inventario = await prisma.inventario.update({
      where: {
        id: Number(params.id),
      },
      data: data,
    });
    return NextResponse.json(inventario);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
