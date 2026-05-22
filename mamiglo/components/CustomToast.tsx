import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastContextType {
  show: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const show = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    const newToast: ToastProps = { id, type, title, message };

    setToasts(prev => [...prev, newToast]);

    // Auto hide after 3 seconds
    setTimeout(() => {
      hide(id);
    }, 3000);
  };

  const hide = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container}>
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            style={[
              styles.toast,
              { backgroundColor: getToastColor(toast.type) }
            ]}
          >
            <View style={styles.toastContent}>
              <Ionicons
                name={getToastIcon(toast.type) as any}
                size={24}
                color="white"
                style={styles.icon}
              />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{toast.title}</Text>
                <Text style={styles.message}>{toast.message}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
});