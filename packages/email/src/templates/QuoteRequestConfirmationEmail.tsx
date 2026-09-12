import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface QuoteRequestConfirmationEmailProps {
  name: string;
  companyName: string;
  companyPhone: string;
}

export function QuoteRequestConfirmationEmail({
  name,
  companyName,
  companyPhone,
}: QuoteRequestConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>We received your quote request</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "32px",
            borderRadius: "8px",
            margin: "24px auto",
            maxWidth: "480px",
          }}
        >
          <Heading style={{ fontSize: "20px" }}>Thanks, {name}!</Heading>
          <Section>
            <Text>
              We received your request and a member of the {companyName} team
              will reach out shortly to confirm details and pricing.
            </Text>
            <Text>
              Need to reach us sooner? Call {companyPhone}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default QuoteRequestConfirmationEmail;
