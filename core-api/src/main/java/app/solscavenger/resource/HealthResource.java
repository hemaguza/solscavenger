package app.solscavenger.resource;

import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/v1/public/health")
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {

    @GET
    @PermitAll
    public Response health() {
        return Response.ok("{\"status\":\"UP\"}").build();
    }
}

