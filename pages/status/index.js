import React, { useEffect, useState } from "react";
import useSWR from "swr";

async function fetchApi(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

export default function Status() {
  const { data, isLoading } = useSWR("/api/v1/status/", fetchApi, {
    refreshInterval: 2_000,
  });
  const [points, setPoints] = useState(0);
  const [timer, setTimer] = useState();

  useEffect(() => {
    const newTimer = setInterval(
      () => setPoints((prev) => (prev + 1) % 3),
      1_000,
    );
    setTimer(newTimer);

    return () => clearTimeout(newTimer);
  }, [isLoading]);

  useEffect(() => {
    if (timer && !isLoading) {
      clearInterval(timer);
      setTimer(undefined);
    }
  }, [isLoading, timer]);

  if (isLoading) {
    return (
      <div>Carregando{Array.from({ length: points + 1 }).map(() => ".")}</div>
    );
  }

  return (
    <div>
      <h1>Status</h1>
      <UpdatedAt updated_at={data.updated_at} />
      <h2>Dependências: </h2>
      <DatabaseInfo database={data.dependencies.database} />
    </div>
  );
}

function UpdatedAt({ updated_at }) {
  const formatedDate = new Date(updated_at).toLocaleString("pt-BR");

  return (
    <div>
      <p>
        Última atualização às: <strong>{formatedDate}</strong>
      </p>
    </div>
  );
}

function DatabaseInfo({ database }) {
  return (
    <details open>
      <summary>Banco de Dados</summary>
      <p>
        <strong>N° Máximo de Conexões:</strong> {database.max_connections}
      </p>
      <p>
        <strong>Versão:</strong>
        {database.version}
      </p>
      <p>
        <strong>Conexões abertas:</strong>
        {database.opened_connections}
      </p>
    </details>
  );
}
