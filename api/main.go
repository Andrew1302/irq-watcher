package main

import (
	"bufio"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"fmt"
	
	httpSwagger "github.com/swaggo/http-swagger"
	_ "irq-watcher-api/docs"
)

// @title IRQ Watcher API
// @version 1.0
// @description API para monitoramento de interrupções e métricas do sistema
// @host localhost:8080
// @BasePath /

var categorias = map[string]string{
	// Rede
	"eth": "rede", "enp": "rede", "ens": "rede", "eno": "rede",
	"wlan": "rede", "wlx": "rede", "mlx": "rede", "mlx5": "rede",
	"bnx": "rede", "ath10k_pci": "rede", "iwlwifi": "rede",
	"e1000e": "rede", "igb": "rede", "r8169": "rede",
	"virtio_net": "rede", "veth": "rede",

	// Armazenamento
	"nvme": "armazenamento", "sd": "armazenamento", "sda": "armazenamento",
	"sdhci": "armazenamento", "mmc": "armazenamento", "scsi": "armazenamento",
	"sata": "armazenamento", "ata": "armazenamento", "ahci": "armazenamento",
	"dm-": "armazenamento", "md": "armazenamento", "uas": "armazenamento",
	"usb-storage": "armazenamento",

	// USB
	"usb": "usb", "xhci": "usb", "xhci_hcd": "usb", "ehci": "usb",
	"uhci": "usb", "ohci": "usb",

	// Entrada
	"i8042": "entrada", "psmouse": "entrada", "usbhid": "entrada",
	"hid": "entrada", "serio": "entrada", "ELAN": "entrada",
	"SYNA": "entrada", "rmi4": "entrada",

	// GPU
	"amdgpu": "gpu", "i915": "gpu", "nvidia": "gpu", "nouveau": "gpu",

	// Áudio
	"snd_hda_intel": "audio", "snd_": "audio", "sof-audio": "audio", "acp": "audio",

	// Energia
	"acpi": "energia", "thermal": "energia", "intel_thermal": "energia",

	// Temporizador
	"rtc": "temporizador", "timer": "temporizador",

	// Inter-CPU
	"IPI": "inter-cpu", "RES": "inter-cpu", "CAL": "inter-cpu", "TLB": "inter-cpu",

	// Kernel interno
	"NMI": "kernel", "LOC": "kernel", "SPU": "kernel", "PMI": "kernel",
	"IWI": "kernel", "RTR": "kernel", "MCE": "kernel", "MCP": "kernel",
	"ERR": "kernel", "MIS": "kernel", "THR": "kernel", "TRM": "kernel", "DFR": "kernel",

	// PCIe
	"pciehp": "pcie", "pcieport": "pcie", "thunderbolt": "pcie",

	// Virtualização
	"virtio": "virtualizacao", "vmbus": "virtualizacao", "hv_": "virtualizacao",

	// GPIO/Sensores
	"gpio": "gpio", "i2c": "gpio", "spi": "gpio",
}

type CpuTimes struct {
	User, Nice, System, Idle, Iowait, Irq, Softirq, Steal uint64
}

type CpuUsage struct {
	Interrupcoes float64 `json:"interrupcoes"`
	Util         float64 `json:"util"`
	Ocioso       float64 `json:"ocioso"`
}

type InterrupcoesResponse struct {
	PorCPU         map[string]uint64                       `json:"por_cpu"`
	PorCategoria   map[string]map[string]uint64            `json:"por_categoria"`
	TrocasContexto uint64                                  `json:"trocas_de_contexto"`
}

var lastStat CpuTimes
var lastTime time.Time

func readProcStat() (CpuTimes, uint64, error) {
	f, err := os.Open("/proc/stat")
	if err != nil {
		return CpuTimes{}, 0, err
	}
	defer f.Close()

	var stat CpuTimes
	var ctxt uint64
	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) == 0 {
			continue
		}

		switch fields[0] {
		case "cpu":
			if len(fields) >= 8 {
				stat.User, _ = strconv.ParseUint(fields[1], 10, 64)
				stat.Nice, _ = strconv.ParseUint(fields[2], 10, 64)
				stat.System, _ = strconv.ParseUint(fields[3], 10, 64)
				stat.Idle, _ = strconv.ParseUint(fields[4], 10, 64)
				stat.Iowait, _ = strconv.ParseUint(fields[5], 10, 64)
				stat.Irq, _ = strconv.ParseUint(fields[6], 10, 64)
				stat.Softirq, _ = strconv.ParseUint(fields[7], 10, 64)
				if len(fields) > 8 {
					stat.Steal, _ = strconv.ParseUint(fields[8], 10, 64)
				}
			}
		case "ctxt":
			ctxt, _ = strconv.ParseUint(fields[1], 10, 64)
		}
	}
	return stat, ctxt, nil
}

func delta(a, b CpuTimes) CpuTimes {
	return CpuTimes{
		User:     b.User - a.User,
		Nice:     b.Nice - a.Nice,
		System:   b.System - a.System,
		Idle:     b.Idle - a.Idle,
		Iowait:   b.Iowait - a.Iowait,
		Irq:      b.Irq - a.Irq,
		Softirq:  b.Softirq - a.Softirq,
		Steal:    b.Steal - a.Steal,
	}
}

func calcularUso(delta CpuTimes) CpuUsage {
	total := delta.User + delta.Nice + delta.System + delta.Idle + delta.Iowait + delta.Irq + delta.Softirq + delta.Steal
	if total == 0 {
		return CpuUsage{}
	}
	return CpuUsage{
		Interrupcoes: float64(delta.Irq+delta.Softirq) / float64(total),
		Util:         float64(delta.User+delta.Nice+delta.System) / float64(total),
		Ocioso:       float64(delta.Idle+delta.Iowait) / float64(total),
	}
}

func classificarCategoria(nome string) string {
	for k, v := range categorias {
		if strings.Contains(nome, k) {
			return v
		}
	}
	return "outras"
}

func readProcInterrupts() (map[string]uint64, map[string]map[string]uint64, error) {
	f, err := os.Open("/proc/interrupts")
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	var cpuCount int
	porCPU := make(map[string]uint64)
	porCategoria := make(map[string]map[string]uint64)

	linha := 0
	for scanner.Scan() {
		texto := scanner.Text()
		campos := strings.Fields(texto)
		if linha == 0 {
			cpuCount = len(campos) - 1
			linha++
			continue
		}

		if len(campos) < cpuCount+1 {
			continue
		}

		nome := campos[len(campos)-1]
		if strings.Contains(nome, "interrupts") || strings.Contains(nome, "retries") ||
			strings.Contains(nome, "exceptions") || strings.Contains(nome, "polls") ||
			strings.Contains(nome, "event") || strings.Contains(nome, "shootdowns") {
				prefixo := strings.TrimSuffix(campos[0], ":")
				nome = prefixo
		}
		fmt.Println(nome)
		categoria := classificarCategoria(nome)

		if _, ok := porCategoria[categoria]; !ok {
			porCategoria[categoria] = make(map[string]uint64)
		}

		for i := 0; i < cpuCount; i++ {
			val, err := strconv.ParseUint(campos[1+i], 10, 64)
			if err == nil {
				cpuStr := strconv.Itoa(i)
				porCPU[cpuStr] += val
				porCategoria[categoria][cpuStr] += val
			}
		}
	}
	return porCPU, porCategoria, nil
}

// @Summary Obter métricas do sistema
// @Description Retorna estatísticas de interrupções por CPU, categorias e trocas de contexto
// @Tags metrics
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Métricas do sistema"
// @Failure 500 {string} string "Erro interno do servidor"
// @Router /metrics [get]
func handler(w http.ResponseWriter, r *http.Request) {
	atualStat, ctxt, err := readProcStat()
	if err != nil {
		http.Error(w, "Erro lendo /proc/stat", 500)
		return
	}
	porCPU, porCategoria, err := readProcInterrupts()
	if err != nil {
		http.Error(w, "Erro lendo /proc/interrupts", 500)
		return
	}

	if lastTime.IsZero() {
		lastStat = atualStat
		lastTime = time.Now()
		resp := InterrupcoesResponse{
			PorCPU:         porCPU,
			PorCategoria:   porCategoria,
			TrocasContexto: ctxt,
		}
		json.NewEncoder(w).Encode(resp)
		return
	}

	d := delta(lastStat, atualStat)
	uso := calcularUso(d)

	resp := struct {
		InterrupcoesTempo CpuUsage                        `json:"interrupcoes_tempo"`
		PorCPU            map[string]uint64               `json:"por_cpu"`
		PorCategoria      map[string]map[string]uint64    `json:"por_categoria"`
		TrocasDeContexto  uint64                          `json:"trocas_de_contexto"`
	}{
		InterrupcoesTempo: uso,
		PorCPU:            porCPU,
		PorCategoria:      porCategoria,
		TrocasDeContexto:  ctxt,
	}

	lastStat = atualStat
	lastTime = time.Now()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/metrics", handler)
	http.HandleFunc("/docs/", httpSwagger.WrapHandler)
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", nil))
}
