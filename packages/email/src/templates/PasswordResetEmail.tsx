import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function PasswordResetEmail({ name, resetUrl, expiresInMinutes }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your SILAS password</Preview>
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
          <Heading style={{ fontSize: "20px" }}>Reset your password</Heading>
          <Section>
            <Text>Hi {name},</Text>
            <Text>
              We received a request to reset your SILAS password. Click the button below to
              choose a new one — this link expires in {expiresInMinutes} minutes.
            </Text>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#2fd9df",
                color: "#0a1130",
                padding: "12px 20px",
                borderRadius: "6px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Reset password
            </Button>
            <Text style={{ color: "#71717a", fontSize: "13px", marginTop: "24px" }}>
              If you didn&apos;t request this, you can safely ignore this email — your password
              won&apos;t be changed.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
