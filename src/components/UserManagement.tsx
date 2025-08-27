import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useRoles, type AppRole } from '@/hooks/useRoles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleDebugPanel } from '@/components/RoleDebugPanel';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: AppRole;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { assignRole, isSuperAdmin } = useRoles();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use RPC function to get users from auth.users (admin only)
      const { data: authUsers, error: authError } = await supabase.rpc('admin_list_users');
      
      if (authError) {
        console.error('Failed to fetch users from auth.users:', authError);
        toast.error('Failed to fetch users - insufficient permissions');
        return;
      }

      // Get profiles and roles for each user
      const usersWithData = await Promise.all(
        authUsers.map(async (authUser: any) => {
          // Get profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();

          // Get the primary role using the RPC function
          const { data: userRole, error: roleError } = await supabase
            .rpc('get_user_role', { _user_id: authUser.id });

          if (roleError) {
            console.error('Error fetching role for user:', authUser.id, roleError);
          }

          return {
            id: authUser.id,
            email: authUser.email || 'No Email',
            full_name: profile?.full_name || 'No Name',
            avatar_url: profile?.avatar_url || '',
            role: userRole || 'user' as AppRole,
            created_at: authUser.created_at
          };
        })
      );

      setUsers(usersWithData);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      setLoading(true);
      
      const result = await assignRole(userId, newRole);
      
      if (result.success) {
        toast.success(`User role berhasil diubah menjadi ${newRole.replace('_', ' ').toUpperCase()}`);
        
        // Refresh the users list to show updated roles
        await fetchUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleteLoading(userId);
      
      // Call admin RPC to delete user
      const { error } = await supabase.rpc('admin_delete_user' as any, { 
        _user_id: userId 
      });
      
      if (error) {
        console.error('Delete user error:', error);
        toast.error('Gagal menghapus user: ' + error.message);
        return;
      }
      
      toast.success('User berhasil dihapus');
      await fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500 text-white';
      case 'admin': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Debug Panel - Remove this in production */}
      <RoleDebugPanel />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {users.map((userItem) => (
              <div 
                key={userItem.id} 
                className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg gap-3 md:gap-4"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarImage src={userItem.avatar_url} alt={userItem.full_name} />
                    <AvatarFallback className="text-xs md:text-sm">
                      {userItem.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="text-sm md:text-base font-medium">{userItem.full_name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{userItem.email}</p>
                    <p className="text-xs text-blue-600">ID: {userItem.id.slice(0, 8)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                  <Badge className={`${getRoleBadgeColor(userItem.role)} text-xs`}>
                    {userItem.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  
                  {isSuperAdmin && (
                    <>
                      <Select 
                        value={userItem.role} 
                        onValueChange={(value: AppRole) => handleRoleChange(userItem.id, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-28 md:w-32 text-xs md:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoading === userItem.id}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus user "{userItem.full_name}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};