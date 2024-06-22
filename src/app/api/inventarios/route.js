import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function POST(request) {
  const data = await request.json();

  try {
    // Iniciar una transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Actualizar el inventario y agregar la compra
      const compra = await prisma.compra.create({
        data: {
          articuloId: data.articuloId,
          cantidad: data.cantidad,
          valor_unidad: parseFloat(data.valor_unidad),
          fecha: data.fecha || new Date(),
          tipo_pago: data.tipo_pago,
          pagado: data.pagado,
          total: data.total,
        },
      });

      // Actualizar el inventario
      const inventario = await prisma.inventario.update({
        where: { articuloId: data.articuloId },
        data: { unidades: { increment: data.cantidad } },
      });

      return { compra, inventario };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

export async function PUT(request) {
  const data = await request.json();

  try {
    // Iniciar una transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Actualizar la compra existente
      const compra = await prisma.compra.update({
        where: { id: data.id },
        data: {
          articuloId: data.articuloId,
          cantidad: data.cantidad,
          valor_unidad: data.valor_unidad,
          fecha: data.fecha || new Date(),
          tipo_pago: data.tipo_pago,
          pagado: data.pagado,
          total: data.total,
        },
      });

      // Actualizar el inventario
      const inventario = await prisma.inventario.update({
        where: { articuloId: data.articuloId },
        data: { unidades: { increment: data.cantidad } },
      });

      return { compra, inventario };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

export async function GET(request) {
  try {
    const inventarios = await prisma.inventario.findMany({
      include: {
        articulo: true,
      },
    });
    return NextResponse.json(inventarios);
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    return NextResponse.json({
      error: "Error al obtener el inventario",
    });
  }
}
