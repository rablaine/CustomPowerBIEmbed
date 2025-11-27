using Microsoft.AnalysisServices.AdomdClient;
using System.Data;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

// Configuration
var config = app.Configuration.GetSection("FabricConfig");
var tenantId = config["TenantId"];
var clientId = config["ClientId"];
var clientSecret = config["ClientSecret"];
var workspaceName = config["WorkspaceName"];
var datasetName = config["DatasetName"];

// Build connection string
var connectionString = $"Data Source=powerbi://api.powerbi.com/v1.0/myorg/{workspaceName};" +
                      $"Initial Catalog={datasetName};" +
                      $"User ID=app:{clientId}@{tenantId};" +
                      $"Password={clientSecret};";

app.Logger.LogInformation("============================================================");
app.Logger.LogInformation("XMLA Proxy Service Starting (.NET)");
app.Logger.LogInformation("============================================================");
app.Logger.LogInformation("Workspace: {workspace}", workspaceName);
app.Logger.LogInformation("Dataset: {dataset}", datasetName);
app.Logger.LogInformation("============================================================");

// Health check endpoint
app.MapGet("/health", () =>
{
    return Results.Ok(new
    {
        status = "healthy",
        service = "XMLA Proxy (.NET)",
        workspace = workspaceName,
        dataset = datasetName
    });
});

// Test connection endpoint
app.MapGet("/test", async () =>
{
    try
    {
        var result = await ExecuteDaxQuery("EVALUATE { 1 }");
        return Results.Ok(new
        {
            status = "success",
            message = "XMLA connection working",
            testResult = result
        });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Test connection failed");
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "XMLA connection failed"
        );
    }
});

// Query execution endpoint
app.MapPost("/query", async (QueryRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Query))
    {
        return Results.BadRequest(new { error = "Missing 'query' field" });
    }

    try
    {
        var data = await ExecuteDaxQuery(request.Query);
        return Results.Ok(new
        {
            data,
            rowCount = data.Count
        });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Query execution failed: {query}", request.Query);
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "Query execution failed"
        );
    }
});

app.Run();

// Helper method to execute DAX queries
async Task<List<Dictionary<string, object?>>> ExecuteDaxQuery(string daxQuery)
{
    return await Task.Run(() =>
    {
        var results = new List<Dictionary<string, object?>>();

        using var connection = new AdomdConnection(connectionString);
        connection.Open();

        using var command = new AdomdCommand(daxQuery, connection);
        command.CommandTimeout = 30;

        using var reader = command.ExecuteReader();
        
        // Get column names
        var columnNames = new List<string>();
        for (int i = 0; i < reader.FieldCount; i++)
        {
            columnNames.Add(reader.GetName(i));
        }

        // Read rows
        while (reader.Read())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                row[columnNames[i]] = value;
            }
            results.Add(row);
        }

        return results;
    });
}

// Request model
record QueryRequest(string Query);
