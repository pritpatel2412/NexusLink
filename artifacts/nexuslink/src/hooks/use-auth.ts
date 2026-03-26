import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  useGetMe, 
  useLogin, 
  useSignup, 
  useLogout, 
  getGetMeQueryKey,
  setAuthTokenGetter,
} from "@workspace/api-client-react";

const TOKEN_KEY = "nexuslink_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Wire up the auth token getter once at module load
setAuthTokenGetter(() => getStoredToken());

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      retry: false,
      staleTime: 1000 * 60 * 5,
      enabled: !!getStoredToken(),
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        if (data?.token) {
          storeToken(data.token);
        }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      }
    }
  });

  const signupMutation = useSignup({
    mutation: {
      onSuccess: (data: any) => {
        if (data?.token) {
          storeToken(data.token);
        }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        storeToken(null);
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.clear();
        setLocation("/");
      }
    }
  });

  return {
    user: isError ? null : user,
    isLoading: !!getStoredToken() && isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
