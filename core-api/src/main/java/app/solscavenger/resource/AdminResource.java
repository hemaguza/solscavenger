package app.solscavenger.resource;

import app.solscavenger.dto.UpdateTreasuryConfigRequest;
import app.solscavenger.service.AccountingService;
import app.solscavenger.service.PlatformConfigService;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "SUPERADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_SCAVENGER_ADMIN", "SCAVENGER_ADMIN"})
public class AdminResource {

    @Inject
    AccountingService accountingService;

    @Inject
    PlatformConfigService platformConfigService;

    /**
     * Aggregated metrics summary for the admin dashboard.
     */
    @GET
    @Path("/metrics/summary")
    public Uni<Response> getMetricsSummary() {
        return accountingService.getMetricsSummary()
                .map(summary -> Response.ok(summary).build());
    }

    /**
     * Recent reclaim transactions list.
     */
    @GET
    @Path("/transactions")
    public Uni<Response> getTransactions() {
        return accountingService.listRecentTransactions()
                .map(list -> Response.ok(list).build());
    }

    /**
     * Dead tokens & memecoins ranking for big data analytics.
     */
    @GET
    @Path("/tokens/dead")
    public Uni<Response> getDeadTokensRanking() {
        return accountingService.listDeadTokensRanking()
                .map(list -> Response.ok(list).build());
    }

    /**
     * Current hot-reloadable platform treasury and commission configuration.
     */
    @GET
    @Path("/config")
    public Uni<Response> getPlatformConfig() {
        return platformConfigService.getConfig()
                .map(config -> Response.ok(config).build());
    }

    /**
     * Updates platform treasury wallet and commission in real time (Zero-Restart).
     */
    @PUT
    @Path("/config")
    public Uni<Response> updatePlatformConfig(UpdateTreasuryConfigRequest request) {
        return platformConfigService.updateConfig(request)
                .map(updated -> Response.ok(updated).build());
    }
}
