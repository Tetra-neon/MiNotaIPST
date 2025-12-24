import React, { createContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getGlobalConfig } from '../services/api';

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        nombre: 'MiNota IPST',
        color_primario: '#1976d2',
        color_secundario: '#dc004e',
        logo_url: null,
        banner_activo: false,
        banner_mensaje: ''
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getGlobalConfig();
                if (data) setConfig(data);
            } catch (error) {
                console.error("Error cargando configuración:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const theme = createTheme({
        palette: {
            primary: {
                main: config.color_primario,
            },
            secondary: {
                main: config.color_secundario,
            },
        },
    });

    return (
        <ConfigContext.Provider value={{ config, loading }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ConfigContext.Provider>
    );
};