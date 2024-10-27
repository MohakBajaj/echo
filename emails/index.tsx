import { Icons } from "@/assets/Icons";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Tailwind,
  CodeInline,
  Link,
} from "@react-email/components";
import * as React from "react";

interface EmailProps {
  Code?: string;
}

export default function AccountVerificationEmailTemplate({ Code }: EmailProps) {
  return (
    <Html>
      <Head>
        <title>Please verify your Email to use Uncut</title>
      </Head>
      <Preview>Use the following Verification code to use Uncut</Preview>
      <Tailwind>
        <Body>
          <Container className="mx-auto max-w-2xl p-4">
            <Link
              href="https://echo.bmohak.codes"
              className="mb-2 flex items-center"
            >
              <Icons.logo className="h-16 rotate-180" />{" "}
              <Heading className="translate-y-2 font-mono text-4xl text-black">
                ECHO
              </Heading>
            </Link>
            <Heading className="mb-2 text-2xl font-bold">
              Verify Your Email
            </Heading>
            <Text className="mb-4">
              Welcome to Echo! To access our platform and start engaging with
              the community, please verify your email address by using the
              provided verification code.
            </Text>
            <Text className="mb-1 font-semibold">Verification Code:</Text>
            <div className="flex h-12 select-all items-center rounded bg-gray-200 p-2 px-4">
              <CodeInline className="text-2xl tracking-widest">
                {Code}
              </CodeInline>
            </div>
            <Text className="text-sm">
              This code is valid for a limited time and should not be shared
              with anyone for security reasons.
            </Text>
            <Text className="mt-4">Thank you for choosing Echo.</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
