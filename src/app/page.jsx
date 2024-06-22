function HomePage() {
  return (
    <>
      <div className="flex items-center justify-center mt-4">
        <div class="bg-red-600 p-8 rounded-lg shadow-lg text-center max-w-sm">
          <img
            class="w-32 h-32 mx-auto rounded-full mb-4"
            src="https://via.placeholder.com/150"
            alt="Business Image"
          />
          <h2 class="text-2xl font-bold mb-2">Taller Moto Respuestos RC</h2>
          <p class="text-gray-700">
            Esta es una breve descripción del negocio. Aquí se puede agregar más
            información sobre los servicios o productos que ofrece.
          </p>
        </div>
      </div>
    </>
  );
}

export default HomePage;
