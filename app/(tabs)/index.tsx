import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  FadeIn,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';

type Task = {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: string;
};

const BOARD_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: Colors.light.backlog },
  { id: 'todo', title: 'To Do', color: Colors.light.todo },
  { id: 'inProgress', title: 'In Progress', color: Colors.light.inProgress },
  { id: 'test', title: 'Test', color: Colors.light.test },
  { id: 'done', title: 'Done', color: Colors.light.done },
];

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    duration: '',
  });

  // Load tasks from storage on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addOrUpdateTask = () => {
    if (newTask.title.trim()) {
      let updatedTasks: Task[];
      
      if (editingTask) {
        // Update existing task
        updatedTasks = tasks.map(task => 
          task.id === editingTask.id 
            ? { ...editingTask, ...newTask }
            : task
        );
      } else {
        // Add new task
        const task: Task = {
          id: Date.now().toString(),
          ...newTask,
          status: 'backlog',
        };
        updatedTasks = [...tasks, task];
      }
      
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      closeModal();
    }
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    setNewTask({ title: '', description: '', duration: '' });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      duration: task.duration,
    });
    setModalVisible(true);
  };

  const onDragEnd = (taskId: string, newStatus: string) => {
    if (newStatus !== tasks.find(t => t.id === taskId)?.status) {
      updateTaskStatus(taskId, newStatus);
    }
  };

  const DraggableTask = ({ task }: { task: Task }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isActive = useSharedValue(false);
    const screenWidth = Dimensions.get('window').width;
    const columnWidth = screenWidth / BOARD_COLUMNS.length;

    const gestureHandler = useAnimatedGestureHandler({
      onStart: (_, ctx: any) => {
        ctx.startX = translateX.value;
        ctx.startY = translateY.value;
        isActive.value = true;
      },
      onActive: (event, ctx: any) => {
        translateX.value = ctx.startX + event.translationX;
        translateY.value = ctx.startY + event.translationY;
      },
      onEnd: (event) => {
        isActive.value = false;
        
        // Yeni kolon hesaplama mantığını güncelle
        const currentX = event.absoluteX;
        const newColumnIndex = Math.floor(currentX / columnWidth);
        const clampedColumnIndex = Math.max(0, Math.min(newColumnIndex, BOARD_COLUMNS.length - 1));
        const newStatus = BOARD_COLUMNS[clampedColumnIndex].id;

        // Animasyonlu geri dönüş
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });

        // Sadece farklı bir kolona taşındıysa güncelle
        if (newStatus !== task.status) {
          runOnJS(onDragEnd)(task.id, newStatus);
        }
      },
    });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isActive.value ? 1.03 : 1, {
          damping: 15,
          stiffness: 300,
        })},
      ],
      zIndex: isActive.value ? 1000 : 1,
      shadowOpacity: withSpring(isActive.value ? 0.3 : 0.1),
      shadowRadius: withSpring(isActive.value ? 10 : 5),
      elevation: isActive.value ? 5 : 2,
    }));

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.task, animatedStyle]}>
          <TouchableOpacity onPress={() => openEditModal(task)}>
            <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
            <ThemedText style={styles.taskDescription}>{task.description}</ThemedText>
            <ThemedView style={styles.taskFooter}>
              <ThemedText style={styles.taskDuration}>{task.duration}</ThemedText>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteTask(task.id)}
              >
                <IconSymbol name="trash" size={16} color={Colors.light.icon} />
              </TouchableOpacity>
            </ThemedView>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Backlog Yönetimi</ThemedText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <ThemedText style={styles.addButtonText}>Add Task</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ScrollView style={styles.board}>
          {BOARD_COLUMNS.map((column) => (
            <Animated.View 
              key={column.id}
              entering={FadeIn}
              style={[styles.column, { backgroundColor: Colors.light[column.id] }]}
            >
              <ThemedView style={styles.columnHeader}>
                <ThemedText type="subtitle" style={styles.columnTitle}>
                  {column.title}
                </ThemedText>
                <ThemedText style={styles.taskCount}>
                  {tasks.filter(task => task.status === column.id).length}
                </ThemedText>
              </ThemedView>
              
              {tasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <DraggableTask key={task.id} task={task} />
                ))}
            </Animated.View>
          ))}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Yeni Görev</ThemedText>
              
              <TextInput
                style={styles.input}
                placeholder="Görev Başlığı"
                value={newTask.title}
                onChangeText={(text) => setNewTask({...newTask, title: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Açıklama"
                multiline
                numberOfLines={4}
                value={newTask.description}
                onChangeText={(text) => setNewTask({...newTask, description: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Süre (örn: 2 saat)"
                value={newTask.duration}
                onChangeText={(text) => setNewTask({...newTask, duration: text})}
              />

              <ThemedView style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText>İptal</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={addOrUpdateTask}
                >
                  <ThemedText style={styles.saveButtonText}>Kaydet</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  board: {
    flex: 1,
    padding: 8,
  },
  column: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  columnTitle: {
    textAlign: 'left',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: Colors.light.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  duration: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCount: {
    fontSize: 12,
    color: Colors.light.icon,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButton: {
    padding: 4,
  },
  task: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 8,
  },
  taskDuration: {
    fontSize: 12,
    color: Colors.light.icon,
  },
});