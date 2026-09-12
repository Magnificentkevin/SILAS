import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface QuoteRequestAdminEmailProps {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  message: string;
}

export function QuoteRequestAdminEmail({
  name,
  email,
  phone,
  serviceType,
  message,
}: QuoteRequestAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New quote request from {name}</Preview>
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
          <Heading style={{ fontSize: "20px" }}>New quote request</Heading>
          <Section>
            <Text>
              <strong>Name:</strong> {name}
            </Text>
            <Text>
              <strong>Email:</strong> {email}
            </Text>
            <Text>
              <strong>Phone:</strong> {phone}
            </Text>
            <Text>
              <strong>Service:</strong> {serviceType}
            </Text>
            <Hr />
            <Text>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default QuoteRequestAdminEmail;
