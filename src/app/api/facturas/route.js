import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function POST(request) {
  const data = await request.json();

  try {
    const lastFactura = await prisma.factura.findFirst({
      orderBy: { id: "desc" },
    });
    const nextNumber = lastFactura
      ? `FAC-${String(lastFactura.id + 1).padStart(7, "0")}`
      : "FAC-0000001";

    // Iniciar una transacción
    const result = await prisma.$transaction(async (prisma) => {
      // Crear la factura
      const factura = await prisma.factura.create({
        data: {
          nombre_cliente: data.nombre_cliente,
          dni_cliente: data.dni_cliente,
          tipo_cliente: data.tipo_cliente,
          numero: nextNumber,
          fecha: data.fecha || new Date(),
          sub_total: data.sub_total,
          impuesto: data.impuesto,
          total: data.total,
        },
      });

      // Crear las ventas asociadas y actualizar inventarios
      for (const venta of data.ventas) {
        await prisma.venta.create({
          data: {
            articuloId: venta.articuloId,
            cantidad: venta.cantidad,
            precio_compra: venta.precio_compra,
            precio_venta: venta.precio_venta,
            fecha: venta.fecha || new Date(),
            facturaId: factura.id,
          },
        });
        await prisma.inventario.update({
          where: { articuloId: venta.articuloId },
          data: { unidades: { decrement: venta.cantidad } },
        });
      }

      return factura;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

export async function GET(request) {
  try {
    const lastFactura = await prisma.factura.findFirst({
      orderBy: { id: "desc" },
    });
    const numero = lastFactura ? lastFactura.numero : "FAC-0000000";
    return NextResponse.json({ numero });
  } catch (error) {
    console.error("Error al obtener el último número de factura:", error);
    return NextResponse.json({
      error: "Error al obtener el último número de factura",
    });
  }
}
