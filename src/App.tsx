import { useEffect, useState } from "react";
import { api } from "./api/axios";

const App = () => {
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await api.get("/");

        console.log(res.data);

        setResponse(res.data.message);
      } catch (error) {
        console.error("Error fetching API data:", error);
      }
    };

    getData();
  }, []);

  return (
    <>
      <h1>Hello World from React</h1>
      <h2>{response}</h2>
    </>
  );
};

export default App;