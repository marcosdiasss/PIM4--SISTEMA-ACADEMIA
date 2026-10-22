FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ProjetoAcademia/ProjetoAcademia.csproj ProjetoAcademia/
RUN dotnet restore ProjetoAcademia/ProjetoAcademia.csproj
COPY ProjetoAcademia/ ProjetoAcademia/
RUN dotnet publish ProjetoAcademia/ProjetoAcademia.csproj -c Release -o /app
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080	
EXPOSE 8080
ENTRYPOINT ["dotnet", "ProjetoAcademia.dll"]
