import axios from "axios";

const METHOD = "post";

async function fetchGraphQL(operationsDoc, operationName, variables) {
  return await axios({
    method: METHOD,
    url: process.env.GRAPHQL_URI,
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": process.env.HASURA_API_KEY
    },
    data: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName
    })
  });
}

export async function startFetch(operationsDoc, operationName, variables) {
  try {
    const data = await fetchGraphQL(operationsDoc, operationName, variables);
    
    if (data.data.errors)
      console.log(data.data.errors);
      
    return data.data.data;
  } catch (e) {
    console.log(e);
    return  e;
  }
}
