using System.Text.Json;
using System.Text.Json.Serialization;

namespace ProjetoAcademiaApi.Converters
{
    public class DateOnlyJsonConverter : JsonConverter<DateOnly>
    {
        private const string Formato = "yyyy-MM-dd";

        public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var valor = reader.GetString();
            if (string.IsNullOrWhiteSpace(valor))
                return DateOnly.MinValue;

            if (DateOnly.TryParseExact(valor, Formato, out var data))
                return data;

            if (DateOnly.TryParseExact(valor, "dd/MM/yyyy", out var dataAlternativa))
                return dataAlternativa;

            return DateOnly.MinValue;
        }

        public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString(Formato));
        }
    }
}
