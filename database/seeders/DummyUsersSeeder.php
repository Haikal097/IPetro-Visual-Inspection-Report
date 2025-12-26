<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DummyUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $firstNames = [
            'John', 'Jane', 'Robert', 'Mary', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Jennifer',
            'James', 'Patricia', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
            'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Margaret', 'Anthony', 'Betty', 'Donald', 'Sandra',
            'Mark', 'Ashley', 'Paul', 'Dorothy', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Kenneth', 'Donna',
            'Joshua', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah'
        ];

        $lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
            'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
        ];

        $statuses = ['active', 'active', 'active', 'inactive']; // 75% active, 25% inactive
        $roles = ['admin', 'inspector', 'reviewer', 'inspector', 'reviewer']; // Weighted for more inspectors/reviewers

        $users = [];

        // First, check if basic users already exist
        $basicUsers = [
            [
                'name' => 'Administrator',
                'email' => 'admin@example.com',
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('password123'),
                'remember_token' => Str::random(10),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Inspector',
                'email' => 'inspector@example.com',
                'role' => 'inspector',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('password123'),
                'remember_token' => Str::random(10),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Reviewer',
                'email' => 'reviewer@example.com',
                'role' => 'reviewer',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('password123'),
                'remember_token' => Str::random(10),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert basic users first if they don't exist
        foreach ($basicUsers as $userData) {
            if (!User::where('email', $userData['email'])->exists()) {
                User::create($userData);
            }
        }

        // Now create 47 more dummy users (to make total 50 with the 3 basic ones)
        for ($i = 1; $i <= 47; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            
            $role = $roles[array_rand($roles)];
            $status = $statuses[array_rand($statuses)];
            
            // Adjust counts to ensure we have good distribution
            // We already have 1 of each basic role from above
            if ($i <= 3) { // Create 3 more admins (total 4)
                $role = 'admin';
                $status = 'active';
            } elseif ($i <= 18) { // Create 15 more inspectors (total 16)
                $role = 'inspector';
                $status = 'active';
            } elseif ($i <= 32) { // Create 14 more reviewers (total 15)
                $role = 'reviewer';
                $status = 'active';
            }
            // Remaining 15 users will have random roles

            // Generate email
            $email = strtolower($firstName[0] . $lastName) . $i . '@example.com';
            
            // Random creation date within the last year
            $createdAt = Carbon::now()->subDays(rand(0, 365))->subHours(rand(0, 23))->subMinutes(rand(0, 59));
            
            // If user is active, set email verified, otherwise null
            $emailVerifiedAt = $status === 'active' 
                ? $createdAt->copy()->addHours(rand(1, 24)) 
                : null;

            $users[] = [
                // Columns that exist in your table:
                'name' => $firstName . ' ' . $lastName,
                'email' => $email,
                'role' => $role,
                'status' => $status,
                'email_verified_at' => $emailVerifiedAt,
                'password' => Hash::make('password123'),
                'remember_token' => Str::random(10),
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays(rand(1, 30)),
                
                // Note: These columns are not included because they don't exist:
                // 'phone' - NOT IN YOUR TABLE
                // 'company' - NOT IN YOUR TABLE  
                // 'last_active_at' - NOT IN YOUR TABLE
                
                // These columns exist but we leave them as NULL/default:
                'signature_path' => null,
                'signature_updated_at' => null,
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ];
        }

        // Insert users in batches
        foreach (array_chunk($users, 25) as $chunk) {
            // Use insert to bypass mass assignment restrictions
            User::insert($chunk);
        }

        // Display summary
        $this->command->info('✅ 50 users created successfully!');
        $this->command->info('📝 All users have password: password123');
        $this->command->info('');
        $this->command->info('👥 Role Distribution:');
        $this->command->info('   • Admins: ' . User::where('role', 'admin')->count());
        $this->command->info('   • Inspectors: ' . User::where('role', 'inspector')->count());
        $this->command->info('   • Reviewers: ' . User::where('role', 'reviewer')->count());
        $this->command->info('');
        $this->command->info('📊 Status Distribution:');
        $this->command->info('   • Active: ' . User::where('status', 'active')->count());
        $this->command->info('   • Inactive: ' . User::where('status', 'inactive')->count());
        $this->command->info('');
        $this->command->info('🔑 Test Login Credentials:');
        $this->command->info('   • Admin: admin@example.com / password123');
        $this->command->info('   • Inspector: inspector@example.com / password123');
        $this->command->info('   • Reviewer: reviewer@example.com / password123');
    }
}