import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinBodySchema, type SigninBody } from "@pending/api-contract";
import { Screen } from "../../components/ui/Screen";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useApiSession } from "../../lib/api/session";
import { ApiError } from "../../lib/api/errors";

export default function SigninScreen() {
  const router = useRouter();
  const session = useApiSession();
  const [formError, setFormError] = useState<string | undefined>();
  const form = useForm<SigninBody>({ resolver: zodResolver(signinBodySchema) });

  return (
    <Screen>
      <Text className="type-title mb-6 text-ink">Sign in</Text>
      <View className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label="Email"
              keyboardType="email-address"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label="Password"
              secureTextEntry
              value={field.value ?? ""}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        {formError ? <Text className="type-caption text-danger">{formError}</Text> : null}
        <Button
          label="Sign in"
          onPress={form.handleSubmit(async (values) => {
            try {
              if (!session.client) return;
              const data = await session.client.signin(values);
              await session.actions.setToken(data.token);
              router.replace("/");
            } catch (error) {
              setFormError(error instanceof ApiError ? error.message : "Something went wrong. Try again.");
            }
          })}
        />
        <Button label="Create account" variant="secondary" onPress={() => router.push("/(auth)/signup")} />
      </View>
    </Screen>
  );
}
