console.log("Vimeo", Vimeo);
let client = new Vimeo.Vimeo(
  "{client_id}",
  "{client_secret}",
  "{access_token}"
);

client.request(
  {
    method: "GET",
    path: "/tutorial",
  },
  function (error, body, status_code, headers) {
    if (error) {
      console.log(error);
    }

    console.log(body);
  }
);
