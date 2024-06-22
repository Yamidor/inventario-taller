"use client";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const Stock = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [inventarios, setInventarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const articulosPerPage = 8;
  const alertThreshold = 10; // Umbral de unidades para la alerta

  const addStock = (producto) => {
    MySwal.fire({
      title: "Agregar productos al inventario",
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      allowOutsideClick: false,
      html: `
                <form id="productForm" class="bg-white p-6 rounded shadow-md w-full" style="max-width: 800px;">
                    <h2>Unidades actuales: ${producto.unidades}</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                           <label for="codigo" class="block text-gray-700">Código producto</label>
                           <input type="text" id="codigo" name="codigo" class="w-full px-3 py-2 border rounded" value="${producto.articulo.codigo}" readonly>
                        </div>
                        <div>
                            <label for="nombre" class="block text-gray-700">Nombre</label>
                            <input type="text" id="nombre" name="nombre" class="w-full px-3 py-2 border rounded" value="${producto.articulo.nombre}" readonly>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="tipo_pago" class="block text-gray-700">Tipo Pago</label>
                            <select id="tipo_pago" name="tipo_pago" class="w-full px-3 py-2 border rounded">
                                <option value="Contado">Contado</option>
                                <option value="Credito">Credito</option>
                            </select>
                        </div>
                        <div>
                            <label for="precio_compra" class="block text-gray-700">Precio de Compra</label>
                            <input type="number" id="precio_compra" name="precio_compra" class="w-full px-3 py-2 border rounded" value="${producto.articulo.precio_compra}" readonly>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="precio_venta" class="block text-gray-700">Precio de Venta</label>
                            <input type="number" id="precio_venta" name="precio_venta" class="w-full px-3 py-2 border rounded" value="${producto.articulo.precio_venta}" readonly>
                        </div>
                        <div>
                            <label for="cantidad" class="block text-gray-700">Cantidad</label>
                            <input type="number" id="cantidad" name="cantidad" class="w-full px-3 py-2 border rounded" value="1" min="1">
                        </div>
                    </div>
                    <div class="mb-4">
                        <label for="total" class="block text-gray-700">Total</label>
                        <input type="number" id="total" name="total" class="w-full px-3 py-2 border rounded" readonly>
                    </div>
                </form>
            `,
      didOpen: () => {
        const cantidadInput = document.getElementById("cantidad");
        const totalInput = document.getElementById("total");
        const precioCompra = producto.articulo.precio_compra;

        const updateTotal = () => {
          const cantidad = parseInt(cantidadInput.value, 10);
          const total = precioCompra * cantidad;
          totalInput.value = total;
        };

        cantidadInput.addEventListener("input", updateTotal);
        updateTotal(); // Inicializa el total
      },
      preConfirm: () => {
        const id = producto.id;
        const cantidad =
          parseInt(document.getElementById("cantidad").value, 10) +
          producto.unidades;
        const tipo_pago = document.getElementById("tipo_pago").value;
        const pagado = tipo_pago === "Contado";
        const valor_unidad = producto.articulo.precio_compra;
        const articuloId = producto.articulo.id;

        return { id, articuloId, cantidad, valor_unidad, tipo_pago, pagado };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { id, articuloId, cantidad, valor_unidad, tipo_pago, pagado } =
          result.value;
        const response = await fetch("/api/inventarios/" + id, {
          method: "PUT",
          body: JSON.stringify({
            unidades: cantidad,
            articuloId,
          }),
        });
        if (response.ok) {
          toast.success("Inventario actualizado correctamente");
        } else {
          toast.error("Error al actualizar el inventario");
        }

        // Refresca la lista de inventarios
        const dataArticulos = await loadInventarios();
        setInventarios(dataArticulos);
      }
    });
  };

  async function loadInventarios() {
    const response = await fetch("/api/inventarios");
    const inventarios = await response.json();
    return inventarios.filter(
      (inventario) =>
        inventario.articulo.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        inventario.articulo.codigo.includes(searchTerm)
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      const dataArticulos = await loadInventarios();
      setInventarios(dataArticulos);
    };

    fetchData();
  }, [searchTerm]);

  const handleClickPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleClickNext = () => {
    if ((currentPage + 1) * articulosPerPage < inventarios.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Toaster richColors />
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Inventario</h1>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              className="border text-black border-gray-300 px-3 py-2 mr-2"
              placeholder="Buscar Codigo o por nombre..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inventarios
            .slice(
              currentPage * articulosPerPage,
              (currentPage + 1) * articulosPerPage
            )
            .map((inventario) => (
              <div
                key={inventario.id}
                className={`p-4 border rounded-lg relative hover:bg-white hover:text-gray-600 cursor-pointer ${
                  inventario.unidades <= alertThreshold ? "bg-red-500" : ""
                }`}
                onClick={() => addStock(inventario)}
              >
                <div className="absolute top-0 left-0 p-2">
                  <h1 className="text-xl font-bold">{inventario.unidades}</h1>
                </div>
                <img
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                  src={
                    inventario.articulo.imagen
                      ? inventario.articulo.imagen
                      : "/uploads/noproducto.jfif"
                  }
                  alt={inventario.articulo.nombre}
                />
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">
                    {inventario.articulo.nombre}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Código: {inventario.articulo.codigo}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio venta: ${inventario.articulo.precio_venta}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio compra: ${inventario.articulo.precio_compra}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tipo: {inventario.articulo.tipo}
                  </p>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleClickPrev}
            className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Anterior
          </button>
          <button
            onClick={handleClickNext}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
};

export default Stock;
