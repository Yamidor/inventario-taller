"use client";
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title
);

const Balance = () => {
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());

  useEffect(() => {
    fetchCompras();
    fetchVentas();
  }, []);

  const fetchCompras = async () => {
    await fetch("/api/compras")
      .then((response) => response.json())
      .then((data) => setCompras(data))
      .catch((error) => console.error("Error fetching compras:", error));
  };

  const fetchVentas = () => {
    fetch("/api/ventas")
      .then((response) => response.json())
      .then((data) => setVentas(data))
      .catch((error) => console.error("Error fetching ventas:", error));
  };

  const filtrarPorFecha = (items) => {
    const inicio = new Date(fechaInicio).setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin).setHours(23, 59, 59, 999);
    return items.filter((item) => {
      const fechaItem = new Date(item.fecha).getTime();
      return fechaItem >= inicio && fechaItem <= fin;
    });
  };

  const comprasFiltradas = filtrarPorFecha(compras);
  const ventasFiltradas = filtrarPorFecha(ventas);

  const agruparVentas = (ventas) => {
    return ventas.reduce((acc, venta) => {
      const { codigo, nombre, tipo } = venta.articulo;
      if (tipo !== "Mano de obra") {
        if (!acc[codigo]) {
          acc[codigo] = { nombre, cantidad: 0, precio_venta: 0 };
        }
        acc[codigo].cantidad += venta.cantidad;
        acc[codigo].precio_venta += venta.cantidad * venta.precio_venta;
      }
      return acc;
    }, {});
  };

  const calcularValorInventario = () => {
    const inventario = comprasFiltradas.reduce((acc, compra) => {
      if (compra.articulo.tipo !== "Mano de obra") {
        const valorCompra = compra.total / compra.cantidad;
        acc[compra.articulo.codigo] = {
          nombre: compra.articulo.nombre,
          valor:
            (acc[compra.articulo.codigo]?.valor || 0) +
            compra.cantidad * valorCompra,
        };
      }
      return acc;
    }, {});

    ventasFiltradas.forEach((venta) => {
      if (venta.articulo.tipo !== "Mano de obra") {
        const compra = compras.find(
          (compra) => compra.articulo.codigo === venta.articulo.codigo
        );
        const valorCompra = compra ? compra.total / compra.cantidad : 0;
        inventario[venta.articulo.codigo].valor -= venta.cantidad * valorCompra;
      }
    });

    return inventario;
  };

  const calcularGanancias = () => {
    return ventasFiltradas.reduce((total, venta) => {
      if (venta.articulo.tipo !== "Mano de obra") {
        const compra = compras.find(
          (compra) => compra.articulo.codigo === venta.articulo.codigo
        );
        const precioCompra = compra ? compra.total / compra.cantidad : 0;
        total += (venta.precio_venta - precioCompra) * venta.cantidad;
      }
      return total;
    }, 0);
  };

  const calcularManoDeObra = () => {
    return ventasFiltradas
      .filter((venta) => venta.articulo.tipo === "Mano de obra")
      .reduce((acc, venta) => {
        if (!acc[venta.articulo.codigo]) {
          acc[venta.articulo.codigo] = {
            nombre: venta.articulo.nombre,
            cantidad: 0,
            precio_venta: 0,
          };
        }
        acc[venta.articulo.codigo].cantidad += venta.cantidad;
        acc[venta.articulo.codigo].precio_venta +=
          venta.cantidad * venta.precio_venta;
        return acc;
      }, {});
  };

  const inventario = calcularValorInventario();
  const ganancias = calcularGanancias();
  const ventasAgrupadas = agruparVentas(ventasFiltradas);
  const manoDeObra = calcularManoDeObra();

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.text("Informe de Ventas y Ganancias", 14, 12);

    // Ventas
    doc.autoTable({
      head: [["Código", "Nombre", "Cantidad", "Precio Venta", "Total"]],
      body: Object.entries(ventasAgrupadas).map(([codigo, data]) => [
        codigo,
        data.nombre,
        data.cantidad,
        Number(data.precio_venta / data.cantidad).toFixed(2),
        Number(data.precio_venta).toFixed(2),
      ]),
      startY: 20,
    });

    doc.text(
      `Total Ventas: $${Object.values(ventasAgrupadas)
        .reduce((total, venta) => total + venta.precio_venta, 0)
        .toFixed(2)}`,
      14,
      doc.previousAutoTable.finalY + 10
    );
    doc.text(
      `Ganancias: $${ganancias.toFixed(2)}`,
      14,
      doc.previousAutoTable.finalY + 20
    );

    // Inventario
    doc.autoTable({
      head: [["Código", "Nombre", "Valor del Inventario"]],
      body: Object.entries(inventario).map(([codigo, data]) => [
        codigo,
        data.nombre,
        Number(data.valor).toFixed(2),
      ]),
      startY: doc.previousAutoTable.finalY + 30,
    });

    doc.text(
      `Total Inventario: $${Object.values(inventario)
        .reduce((total, item) => total + item.valor, 0)
        .toFixed(2)}`,
      14,
      doc.previousAutoTable.finalY + 10
    );

    // Mano de obra
    doc.autoTable({
      head: [["Código", "Nombre", "Cantidad", "Precio Venta", "Total"]],
      body: Object.entries(manoDeObra).map(([codigo, data]) => [
        codigo,
        data.nombre,
        data.cantidad,
        Number(data.precio_venta / data.cantidad).toFixed(2),
        Number(data.precio_venta).toFixed(2),
      ]),
      startY: doc.previousAutoTable.finalY + 30,
    });

    doc.text(
      `Total Mano de Obra: $${Object.values(manoDeObra)
        .reduce((total, obra) => total + obra.precio_venta, 0)
        .toFixed(2)}`,
      14,
      doc.previousAutoTable.finalY + 10
    );

    doc.save("informe_balance.pdf");
  };

  const data = {
    labels: ["Inventario", "Ventas", "Ganancias", "Mano de obra"],
    datasets: [
      {
        data: [
          Object.values(inventario).reduce((a, b) => a + b.valor, 0),
          Object.values(ventasAgrupadas).reduce(
            (total, venta) => total + venta.precio_venta,
            0
          ),
          ganancias,
          Object.values(manoDeObra).reduce(
            (total, obra) => total + obra.precio_venta,
            0
          ),
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Balance de Ventas y Ganancias</h1>
      <div className="flex mb-4">
        <div className="mr-2">
          <label>Fecha Inicio</label>
          <DatePicker
            selected={fechaInicio}
            onChange={(date) => setFechaInicio(date)}
            dateFormat="yyyy-MM-dd"
            className="border p-2 text-center text-black"
          />
        </div>
        <div>
          <label>Fecha Fin</label>
          <DatePicker
            selected={fechaFin}
            onChange={(date) => setFechaFin(date)}
            dateFormat="yyyy-MM-dd"
            className="border p-2 text-center text-black"
          />
        </div>
      </div>
      <div className="w-1/2 h-96">
        <Pie data={data} options={options} />
      </div>
      <button
        onClick={generarPDF}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Generar PDF
      </button>
    </div>
  );
};

export default Balance;
